import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';

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
  ) {}

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

      const existingPending = await this.paymentRepo.findOne({
        where: {
          bookingId: booking.id,
          status: PaymentStatus.PENDING_APPROVAL,
        },
        order: { createdAt: 'DESC' },
      });
      if (existingPending) {
        throw new BadRequestException(
          'A bank transfer payment for this booking is already pending approval',
        );
      }

      const amount = Number(booking.carePlanSnapshot.price);

      return this.dataSource.transaction(async (manager) => {
        const payRepo = manager.getRepository(Payment);
        const bookingRepo = manager.getRepository(Booking);
        const patRepo = manager.getRepository(Patient);

        const payment = payRepo.create({
          bookingId: booking.id,
          appointmentId: null,
          userId: familyMember.id,
          amount,
          paymentMethod: dto.paymentMethod,
          status:
            dto.paymentMethod === PaymentMethod.CARD
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING_APPROVAL,
        });

        const saved = await payRepo.save(payment);

        if (dto.paymentMethod === PaymentMethod.CARD) {
          booking.status = BookingStatus.ACTIVE;
          await bookingRepo.save(booking);
          await patRepo.update(booking.patientId, {
            paymentPlan: booking.carePlanSnapshot.name,
          });
        }

        return saved;
      });
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

    const existingPending = await this.paymentRepo.findOne({
      where: {
        appointmentId: appointment.id,
        status: PaymentStatus.PENDING_APPROVAL,
      },
      order: { createdAt: 'DESC' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A bank transfer payment for this appointment is already pending approval',
      );
    }

    const consultationFee = Number(appointment.slot?.consultationFee ?? 0);
    const careHomeFee = Number(appointment.slot?.careHomeFee ?? 0);
    const appointmentAmount = consultationFee + careHomeFee;

    if (appointmentAmount <= 0) {
      throw new BadRequestException(
        'This slot has no fee configured. Contact admin to set fees before paying.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);
      const apptRepo = manager.getRepository(Appointment);

      const payment = payRepo.create({
        bookingId: null,
        appointmentId: appointment.id,
        userId: familyMember.id,
        amount: appointmentAmount,
        paymentMethod: dto.paymentMethod,
        status:
          dto.paymentMethod === PaymentMethod.CARD
            ? PaymentStatus.PAID
            : PaymentStatus.PENDING_APPROVAL,
      });

      const saved = await payRepo.save(payment);

      if (dto.paymentMethod === PaymentMethod.CARD) {
        appointment.status = AppointmentStatus.PRESCRIPTION_PENDING;
        await apptRepo.save(appointment);
      }

      return saved;
    });
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
    return this.dataSource.transaction(async (manager) => {
      const payRepo = manager.getRepository(Payment);
      const bookRepo = manager.getRepository(Booking);
      const apptRepo = manager.getRepository(Appointment);

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

      if (payment.bookingId) {
        const booking = await bookRepo.findOne({
          where: { id: payment.bookingId },
        });
        if (!booking) throw new NotFoundException('Linked booking not found');
        if (booking.status === BookingStatus.CANCELLED) {
          throw new BadRequestException(
            'Cannot approve payment for a cancelled booking',
          );
        }
        booking.status = BookingStatus.ACTIVE;
        await bookRepo.save(booking);

        const patRepo = manager.getRepository(Patient);
        await patRepo.update(booking.patientId, {
          paymentPlan: booking.carePlanSnapshot.name,
        });
      } else if (payment.appointmentId) {
        const appt = await apptRepo.findOne({
          where: { id: payment.appointmentId },
        });
        if (!appt) throw new NotFoundException('Linked appointment not found');
        if (appt.status === AppointmentStatus.PAYMENT_PENDING) {
          appt.status = AppointmentStatus.PRESCRIPTION_PENDING;
          await apptRepo.save(appt);
        }
      }

      return { message: 'Payment approved successfully', payment: updated };
    });
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
