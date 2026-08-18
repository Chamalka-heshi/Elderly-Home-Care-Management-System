import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InitiatePayHerePaymentDto } from './dto/initiate-payhere-payment.dto';
import { PayHereNotifyDto } from './dto/payhere-notify.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MailService } from '../mail/mail.service';

type PaymentReceiptPayload = Parameters<
  MailService['sendPaymentReceiptEmail']
>[0];

export interface PayHereCheckoutResponse {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  hash: string;
  notify_url: string;
  return_url: string;
  cancel_url: string;
  first_name: string;
  last_name: string;
  email: string;
  items: string;
  address: string;
  city: string;
  country: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(FamilyMember)
    private readonly familyRepo: Repository<FamilyMember>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  private getPayHereConfig() {
    return {
      merchantId: this.configService.get<string>('app.payhere.merchantId') ?? '',
      merchantSecret:
        this.configService.get<string>('app.payhere.merchantSecret') ?? '',
      notifyUrl: this.configService.get<string>('app.payhere.notifyUrl') ?? '',
      returnUrl: this.configService.get<string>('app.payhere.returnUrl') ?? '',
      cancelUrl: this.configService.get<string>('app.payhere.cancelUrl') ?? '',
    };
  }

  private ensurePayHereConfigured(): void {
    const config = this.getPayHereConfig();
    if (
      !config.merchantId ||
      !config.merchantSecret ||
      !config.notifyUrl ||
      !config.returnUrl ||
      !config.cancelUrl
    ) {
      throw new InternalServerErrorException(
        'PayHere is not configured on the server',
      );
    }
  }

  private formatPayHereAmount(amount: number): string {
    return Number(amount).toFixed(2);
  }

  private hashMerchantSecret(merchantSecret: string): string {
    return crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();
  }

  private generatePayHereCheckoutHash(
    merchantId: string,
    orderId: string,
    amount: number,
    currency: string,
    merchantSecret: string,
  ): string {
    const secretHash = this.hashMerchantSecret(merchantSecret);
    const payload =
      merchantId +
      orderId +
      this.formatPayHereAmount(amount) +
      currency +
      secretHash;
    return crypto.createHash('md5').update(payload).digest('hex').toUpperCase();
  }

  private verifyPayHereNotifySignature(
    notify: PayHereNotifyDto,
    merchantSecret: string,
  ): boolean {
    const secretHash = this.hashMerchantSecret(merchantSecret);
    const payload =
      notify.merchant_id +
      notify.order_id +
      notify.payhere_amount +
      notify.payhere_currency +
      notify.status_code +
      secretHash;
    const localSig = crypto
      .createHash('md5')
      .update(payload)
      .digest('hex')
      .toUpperCase();
    return localSig === notify.md5sig.toUpperCase();
  }

  private splitFullName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: 'Customer', lastName: 'Customer' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: parts[0] };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private mapPayHereFailureStatus(statusCode: string): PaymentStatus {
    if (statusCode === '0') {
      return PaymentStatus.PENDING;
    }
    return PaymentStatus.REJECTED;
  }

  private async resolveFamilyMember(userId: string): Promise<FamilyMember> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) {
      throw new NotFoundException('Family member profile not found');
    }
    return familyMember;
  }

  private async activatePaidPayment(
    manager: EntityManager,
    payment: Payment,
    paidAt: Date,
  ): Promise<PaymentReceiptPayload | null> {
    const bookRepo = manager.getRepository(Booking);
    const apptRepo = manager.getRepository(Appointment);
    const patRepo = manager.getRepository(Patient);

    if (payment.bookingId) {
      const booking = await bookRepo.findOne({
        where: { id: payment.bookingId },
        relations: ['user', 'user.user', 'patient'],
      });
      if (!booking) throw new NotFoundException('Linked booking not found');
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException(
          'Cannot finalize payment for a cancelled booking',
        );
      }

      booking.status = BookingStatus.ACTIVE;
      await bookRepo.save(booking);

      if (booking.carePlanSnapshot?.name) {
        await patRepo.update(booking.patientId, {
          paymentPlan: booking.carePlanSnapshot.name,
        });
      }

      const fm = booking.user as FamilyMember & {
        user: { fullName: string; email: string };
      };
      const snapshot = booking.carePlanSnapshot;
      const patient = booking.patient;

      return {
        familyMemberName: fm?.user?.fullName ?? 'Customer',
        to: fm?.user?.email ?? '',
        paymentId: payment.id,
        paymentMethod: payment.paymentMethod,
        paidAt: paidAt.toISOString(),
        amount: Number(payment.amount),
        serviceType: 'care_plan',
        patientName: patient?.fullName ?? 'Unknown',
        carePlanName: snapshot?.name,
        carePlanDuration: snapshot
          ? `${snapshot.duration} ${snapshot.durationUnit}`
          : undefined,
      };
    }

    if (payment.appointmentId) {
      const appt = await apptRepo.findOne({
        where: { id: payment.appointmentId },
        relations: [
          'familyMember',
          'familyMember.user',
          'patient',
          'slot',
          'slot.doctor',
          'slot.doctor.user',
        ],
      });
      if (!appt) throw new NotFoundException('Linked appointment not found');

      if (appt.status === AppointmentStatus.PAYMENT_PENDING) {
        appt.status = AppointmentStatus.PRESCRIPTION_PENDING;
        await apptRepo.save(appt);
      }

      const fm = appt.familyMember as FamilyMember & {
        user: { fullName: string; email: string };
      };
      const slot = appt.slot;
      const patient = appt.patient;
      const consultationFee = Number(slot?.consultationFee ?? 0);
      const careHomeFee = Number(slot?.careHomeFee ?? 0);

      return {
        familyMemberName: fm?.user?.fullName ?? 'Customer',
        to: fm?.user?.email ?? '',
        paymentId: payment.id,
        paymentMethod: payment.paymentMethod,
        paidAt: paidAt.toISOString(),
        amount: Number(payment.amount),
        serviceType: 'appointment',
        patientName: patient?.fullName ?? 'Unknown',
        doctorName: slot?.doctor?.user?.fullName ?? undefined,
        appointmentDate: slot?.date ?? undefined,
        appointmentStartTime: slot?.startTime ?? undefined,
        appointmentEndTime: slot?.endTime ?? undefined,
        consultationFee,
        careHomeFee,
      };
    }

    throw new BadRequestException(
      'Payment is not linked to a booking or appointment',
    );
  }

  async initiatePayHerePayment(
    userId: string,
    dto: InitiatePayHerePaymentDto,
  ): Promise<PayHereCheckoutResponse> {
    this.ensurePayHereConfigured();
    const payhere = this.getPayHereConfig();

    const hasBooking = !!dto.bookingId;
    const hasAppointment = !!dto.appointmentId;
    if (hasBooking === hasAppointment) {
      throw new BadRequestException(
        'Provide exactly one of bookingId or appointmentId, not both and not neither.',
      );
    }

    const familyMember = await this.resolveFamilyMember(userId);
    const currency = 'LKR';
    let amount = 0;
    let items = 'Care service payment';
    let address = 'N/A';
    const city = 'Colombo';
    const country = 'Sri Lanka';

    if (dto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId },
        relations: ['patient'],
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.userId !== familyMember.id) {
        throw new NotFoundException(
          'Booking not found or does not belong to your account',
        );
      }
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay for a cancelled booking');
      }
      if (
        !booking.carePlanSnapshot?.price ||
        Number(booking.carePlanSnapshot.price) <= 0
      ) {
        throw new BadRequestException('Booking has an invalid care plan price');
      }

      const existingPaid = await this.paymentRepo.findOne({
        where: { bookingId: booking.id, status: PaymentStatus.PAID },
        order: { createdAt: 'DESC' },
      });
      if (existingPaid) {
        throw new BadRequestException('This booking has already been paid for');
      }

      amount = Number(booking.carePlanSnapshot.price);
      items = booking.carePlanSnapshot.name ?? 'Care plan';
      address = booking.patient?.address ?? address;
    } else {
      const appointment = await this.appointmentRepo.findOne({
        where: { id: dto.appointmentId },
        relations: ['slot', 'patient'],
      });
      if (!appointment) throw new NotFoundException('Appointment not found');
      if (appointment.familyMemberId !== familyMember.id) {
        throw new NotFoundException(
          'Appointment not found or does not belong to your account',
        );
      }
      if (appointment.status !== AppointmentStatus.PAYMENT_PENDING) {
        throw new BadRequestException(
          'This appointment is not awaiting payment. Status: ' +
            appointment.status,
        );
      }

      const existingPaid = await this.paymentRepo.findOne({
        where: {
          appointmentId: appointment.id,
          status: PaymentStatus.PAID,
        },
        order: { createdAt: 'DESC' },
      });
      if (existingPaid) {
        throw new BadRequestException(
          'This appointment has already been paid for',
        );
      }

      const consultationFee = Number(appointment.slot?.consultationFee ?? 0);
      const careHomeFee = Number(appointment.slot?.careHomeFee ?? 0);
      amount = consultationFee + careHomeFee;
      if (amount <= 0) {
        throw new BadRequestException(
          'This slot has no fee configured. Contact admin to set fees before paying.',
        );
      }

      items = 'Doctor consultation';
      address = appointment.patient?.address ?? address;
    }

    const orderId = crypto.randomUUID();
    const payment = this.paymentRepo.create({
      id: orderId,
      bookingId: dto.bookingId ?? null,
      appointmentId: dto.appointmentId ?? null,
      userId: familyMember.id,
      amount,
      paymentMethod: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
      payhereOrderId: orderId,
    });
    const saved = await this.paymentRepo.save(payment);

    const formattedAmount = this.formatPayHereAmount(amount);
    const hash = this.generatePayHereCheckoutHash(
      payhere.merchantId,
      saved.id,
      amount,
      currency,
      payhere.merchantSecret,
    );

    const { firstName, lastName } = this.splitFullName(
      familyMember.user.fullName,
    );

    return {
      merchant_id: payhere.merchantId,
      order_id: saved.id,
      amount: formattedAmount,
      currency,
      hash,
      notify_url: payhere.notifyUrl,
      return_url: payhere.returnUrl,
      cancel_url: payhere.cancelUrl,
      first_name: firstName,
      last_name: lastName,
      email: familyMember.user.email,
      items,
      address,
      city,
      country,
    };
  }

  async handlePayHereNotify(
    notify: Record<string, string>,
  ): Promise<{ message: string }> {
    const requiredFields = [
      'merchant_id',
      'order_id',
      'payment_id',
      'payhere_amount',
      'payhere_currency',
      'status_code',
      'md5sig',
    ] as const;

    for (const field of requiredFields) {
      if (!notify[field]) {
        throw new BadRequestException(`Missing PayHere field: ${field}`);
      }
    }

    const payload: PayHereNotifyDto = {
      merchant_id: notify.merchant_id,
      order_id: notify.order_id,
      payment_id: notify.payment_id,
      payhere_amount: notify.payhere_amount,
      payhere_currency: notify.payhere_currency,
      status_code: notify.status_code,
      md5sig: notify.md5sig,
      status_message: notify.status_message,
      custom_1: notify.custom_1,
      custom_2: notify.custom_2,
      method: notify.method,
    };

    this.ensurePayHereConfigured();
    const payhere = this.getPayHereConfig();

    if (payload.merchant_id !== payhere.merchantId) {
      throw new ForbiddenException('Invalid PayHere merchant');
    }

    if (payload.payhere_currency !== 'LKR') {
      throw new BadRequestException('Invalid PayHere currency');
    }

    if (!this.verifyPayHereNotifySignature(payload, payhere.merchantSecret)) {
      throw new ForbiddenException('Invalid PayHere notification signature');
    }

    const payment = await this.paymentRepo.findOne({
      where: { id: payload.order_id },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found for PayHere order');
    }

    if (
      this.formatPayHereAmount(Number(payment.amount)) !==
      this.formatPayHereAmount(Number(payload.payhere_amount))
    ) {
      throw new BadRequestException('PayHere amount does not match payment');
    }

    if (payment.payhereOrderId && payment.payhereOrderId !== payload.order_id) {
      throw new BadRequestException('PayHere order_id mismatch');
    }

    let emailPayload: PaymentReceiptPayload | null = null;

    await this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);
      const locked = await payRepo.findOne({
        where: { id: payment.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        throw new NotFoundException('Payment not found for PayHere order');
      }

      locked.gatewayStatusCode = payload.status_code;
      locked.gatewayStatusMessage = payload.status_message ?? null;
      locked.payhereOrderId = payload.order_id;
      if (payload.payment_id) {
        locked.payherePaymentId = payload.payment_id;
      }

      if (payload.status_code === '2') {
        if (locked.status === PaymentStatus.PAID) {
          await payRepo.save(locked);
          return;
        }

        const paidAt = new Date();
        locked.status = PaymentStatus.PAID;
        locked.paidAt = paidAt;
        await payRepo.save(locked);

        emailPayload = await this.activatePaidPayment(manager, locked, paidAt);
        return;
      }

      if (locked.status !== PaymentStatus.PAID) {
        locked.status = this.mapPayHereFailureStatus(payload.status_code);
      }
      await payRepo.save(locked);
    });

    if (emailPayload) {
      this.mailService
        .sendPaymentReceiptEmail(emailPayload)
        .catch(() => undefined);
    }

    return { message: 'PayHere notification processed' };
  }

  //Handles payment processing and immediate booking activation for seamless user experience
  async createPayment(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    const hasBooking = !!dto.bookingId;
    const hasAppointment = !!dto.appointmentId;

    if (hasBooking === hasAppointment) {
      throw new BadRequestException(
        'Provide exactly one of bookingId or appointmentId, not both and not neither.',
      );
    }

    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember)
      throw new NotFoundException('Family member profile not found');

    if (dto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.userId !== familyMember.id) {
        throw new NotFoundException(
          'Booking not found or does not belong to your account',
        );
      }
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay for a cancelled booking');
      }
      if (
        !booking.carePlanSnapshot?.price ||
        Number(booking.carePlanSnapshot.price) <= 0
      ) {
        throw new BadRequestException('Booking has an invalid care plan price');
      }

      // Guard: prevent duplicate payments (already paid)
      const existingPaid = await this.paymentRepo.findOne({
        where: { bookingId: booking.id, status: PaymentStatus.PAID },
        order: { createdAt: 'DESC' },
      });
      if (existingPaid) {
        throw new BadRequestException('This booking has already been paid for');
      }

      const amount = Number(booking.carePlanSnapshot.price);

      // Determine initial payment status: bank transfers should remain pending approval
      const initialStatus =
        dto.paymentMethod === PaymentMethod.BANK_TRANSFER
          ? PaymentStatus.PENDING_APPROVAL
          : PaymentStatus.PAID;

      const saved = await this.dataSource.transaction(async (manager) => {
        const payRepo = manager.getRepository(Payment);
        const bookingRepo = manager.getRepository(Booking);
        const patRepo = manager.getRepository(Patient);

        const payment = payRepo.create({
          bookingId: booking.id,
          appointmentId: null,
          userId: familyMember.id,
          amount,
          paymentMethod: dto.paymentMethod,
          status: initialStatus,
        });

        const saved = await payRepo.save(payment);

        // Only activate the booking immediately if the payment is considered paid
        if (initialStatus === PaymentStatus.PAID) {
          booking.status = BookingStatus.ACTIVE;
          await bookingRepo.save(booking);
          await patRepo.update(booking.patientId, {
            paymentPlan: booking.carePlanSnapshot.name,
          });
        }

        return saved;
      });

      // Send receipt email only when the payment is already paid (i.e., card)
      if (saved.status === PaymentStatus.PAID) {
        const patient = await this.paymentRepo.manager
          .getRepository(Patient)
          .findOne({ where: { id: booking.patientId } });
        const snapshot = booking.carePlanSnapshot;
        this.mailService
          .sendPaymentReceiptEmail({
            familyMemberName: familyMember.user.fullName,
            to: familyMember.user.email,
            paymentId: saved.id,
            paymentMethod: dto.paymentMethod,
            paidAt: saved.createdAt.toISOString(),
            amount,
            serviceType: 'care_plan',
            patientName: patient?.fullName ?? 'Unknown',
            carePlanName: snapshot?.name,
            carePlanDuration: snapshot
              ? `${snapshot.duration} ${snapshot.durationUnit}`
              : undefined,
          })
          .catch(() => undefined);
      }

      return saved;
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointmentId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.familyMemberId !== familyMember.id) {
      throw new NotFoundException(
        'Appointment not found or does not belong to your account',
      );
    }
    if (appointment.status !== AppointmentStatus.PAYMENT_PENDING) {
      throw new BadRequestException(
        'This appointment is not awaiting payment. Status: ' +
        appointment.status,
      );
    }

    // Guard: prevent duplicate payments (already paid)
    const existingPaid = await this.paymentRepo.findOne({
      where: { appointmentId: appointment.id, status: PaymentStatus.PAID },
      order: { createdAt: 'DESC' },
    });
    if (existingPaid) {
      throw new BadRequestException('This appointment has already been paid for');
    }

    const consultationFee = Number(appointment.slot?.consultationFee ?? 0);
    const careHomeFee = Number(appointment.slot?.careHomeFee ?? 0);
    const appointmentAmount = consultationFee + careHomeFee;

    if (appointmentAmount <= 0) {
      throw new BadRequestException(
        'This slot has no fee configured. Contact admin to set fees before paying.',
      );
    }

    // Determine initial payment status: bank transfers should remain pending approval
    const initialStatus =
      dto.paymentMethod === PaymentMethod.BANK_TRANSFER
        ? PaymentStatus.PENDING_APPROVAL
        : PaymentStatus.PAID;

    const saved = await this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);
      const apptRepo = manager.getRepository(Appointment);

      const payment = payRepo.create({
        bookingId: null,
        appointmentId: appointment.id,
        userId: familyMember.id,
        amount: appointmentAmount,
        paymentMethod: dto.paymentMethod,
        status: initialStatus,
      });

      const saved = await payRepo.save(payment);

      // Only activate the appointment immediately if the payment is considered paid
      if (initialStatus === PaymentStatus.PAID) {
        appointment.status = AppointmentStatus.PRESCRIPTION_PENDING;
        await apptRepo.save(appointment);
      }

      return saved;
    });

    // Send receipt email only when the payment is already paid (i.e., card)
    if (saved.status === PaymentStatus.PAID) {
      const slot = (appointment as any).slot;
      const doctor = slot?.doctor;
      const patient = (appointment as any).patient;
      this.mailService
        .sendPaymentReceiptEmail({
          familyMemberName: familyMember.user.fullName,
          to: familyMember.user.email,
          paymentId: saved.id,
          paymentMethod: dto.paymentMethod,
          paidAt: saved.createdAt.toISOString(),
          amount: appointmentAmount,
          serviceType: 'appointment',
          patientName: patient?.fullName ?? 'Unknown',
          doctorName: doctor?.user?.fullName ?? undefined,
          appointmentDate: slot?.date ?? undefined,
          appointmentStartTime: slot?.startTime ?? undefined,
          appointmentEndTime: slot?.endTime ?? undefined,
          consultationFee: consultationFee,
          careHomeFee: careHomeFee,
        })
        .catch(() => undefined);
    }

    return saved;
  }

  //Retrieves family payments for historical tracking and display
  async getMyPayments(userId: string): Promise<Payment[]> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember)
      throw new NotFoundException('Family member profile not found');

    return this.paymentRepo.find({
      where: { userId: familyMember.id },
      order: { createdAt: 'DESC' },
    });
  }

  //Provides doctors with appointment payment history excluding care home fees
  async getDoctorPayments(userId: string): Promise<any[]> {
    const rows = await this.paymentRepo
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.appointment', 'appointment')
      .innerJoinAndSelect('appointment.slot', 'slot')
      .innerJoinAndSelect('slot.doctor', 'doctor')
      .innerJoinAndSelect('doctor.user', 'doctorUser')
      .innerJoinAndSelect('payment.user', 'familyMember')
      .innerJoinAndSelect('familyMember.user', 'familyUser')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .where('doctorUser.id = :userId', { userId })
      .andWhere('payment.appointmentId IS NOT NULL')
      .andWhere('payment.status = :status', { status: 'paid' })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    return rows.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId,
      amount: Number(p.amount),
      consultationFee: Number(
        (p.appointment as any)?.slot?.consultationFee ?? 0,
      ),
      careHomeFee: Number((p.appointment as any)?.slot?.careHomeFee ?? 0),
      paymentMethod: p.paymentMethod,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      familyMember: {
        id: p.user?.id,
        fullName: (p.user as any)?.user?.fullName ?? 'Unknown',
        email: (p.user as any)?.user?.email ?? '',
      },
      patient: {
        id: (p.appointment as any)?.patient?.id,
        fullName: (p.appointment as any)?.patient?.fullName ?? 'Unknown',
      },
      slot: {
        date: (p.appointment as any)?.slot?.date,
        startTime: (p.appointment as any)?.slot?.startTime,
        endTime: (p.appointment as any)?.slot?.endTime,
      },
    }));
  }

  //Allows admins to review manual bank transfers before finalizing
  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING_APPROVAL,
      },
      relations: ['user', 'user.user', 'booking', 'appointment'],
      order: { createdAt: 'ASC' },
    });
  }

  //Fetches complete payment ledger for admin auditing
  async getAllPayments(): Promise<Payment[]> {
    return this.paymentRepo.find({
      relations: ['user', 'user.user', 'booking', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  //Finalizes bank transfers and instantly updates associated booking or appointment status
  async approvePayment(
    id: string,
  ): Promise<{ message: string; payment: Payment }> {
    // Collect email payload outside the transaction so the email is only sent
    // after the DB commit succeeds — prevents receipt emails on rolled-back txns.
    let emailPayload: Parameters<MailService['sendPaymentReceiptEmail']>[0] | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);

      const payment = await payRepo.findOne({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
        throw new BadRequestException(
          'Only bank transfer payments require manual approval',
        );
      }
      if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          'Payment is not in pending_approval state',
        );
      }

      payment.status = PaymentStatus.PAID;
      const updated = await payRepo.save(payment);
      const paidAt = updated.updatedAt ?? new Date();

      emailPayload = await this.activatePaidPayment(
        manager,
        updated,
        paidAt,
      );

      return { message: 'Payment approved successfully', payment: updated };
    });

    // Send receipt email only after the transaction has committed successfully
    if (emailPayload) {
      this.mailService
        .sendPaymentReceiptEmail(emailPayload)
        .catch(() => undefined);
    }

    return result;
  }

  //Voids a payment attempt and cancels the linked service to ensure financial integrity
  async rejectPayment(
    id: string,
  ): Promise<{ message: string; payment: Payment }> {
    return this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);
      const bookRepo = manager.getRepository(Booking);
      const apptRepo = manager.getRepository(Appointment);

      const payment = await payRepo.findOne({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
        throw new BadRequestException(
          'Only bank transfer payments can be rejected',
        );
      }
      if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          'Payment is not in pending_approval state',
        );
      }

      payment.status = PaymentStatus.REJECTED;
      const updated = await payRepo.save(payment);

      if (payment.bookingId) {
        const booking = await bookRepo.findOne({
          where: { id: payment.bookingId },
        });
        if (booking) {
          booking.status = BookingStatus.CANCELLED;
          await bookRepo.save(booking);
        }
      } else if (payment.appointmentId) {
        const appt = await apptRepo.findOne({
          where: { id: payment.appointmentId },
        });
        if (appt && appt.status === AppointmentStatus.PAYMENT_PENDING) {
          appt.status = AppointmentStatus.CANCELLED;
          await apptRepo.save(appt);
        }
      }

      return { message: 'Payment rejected successfully', payment: updated };
    });
  }
}