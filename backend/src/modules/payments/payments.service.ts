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
  AppointmentBooking,
  AppointmentBookingStatus,
} from '../appointments/entities/appointment-booking.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(AppointmentBooking)
    private readonly appointmentBookingRepo: Repository<AppointmentBooking>,
    @InjectRepository(FamilyMember)
    private readonly familyRepo: Repository<FamilyMember>,
    private readonly dataSource: DataSource,
  ) {}

  async createPayment(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    const hasBooking = !!dto.bookingId;
    const hasAppointment = !!dto.appointmentId;
    if (hasBooking === hasAppointment) {
      throw new BadRequestException('Provide either bookingId or appointmentId');
    }

    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) throw new NotFoundException('Family member profile not found');

    if (dto.bookingId) {
      // Existing care plan booking flow (do not change behavior)
      const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.userId !== familyMember.id) {
        throw new NotFoundException('Booking not found or does not belong to your account');
      }
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay for a cancelled booking');
      }
      if (!booking.carePlanSnapshot?.price || Number(booking.carePlanSnapshot.price) <= 0) {
        throw new BadRequestException('Booking has invalid care plan snapshot amount');
      }

      const existingPending = await this.paymentRepo.findOne({
        where: { bookingId: booking.id, status: PaymentStatus.PENDING_APPROVAL },
        order: { createdAt: 'DESC' },
      });
      if (existingPending) {
        throw new BadRequestException('A bank transfer payment is already pending approval');
      }

      const amount = Number(booking.carePlanSnapshot.price);

      return this.dataSource.transaction(async (manager) => {
        const paymentRepository = manager.getRepository(Payment);
        const bookingRepository = manager.getRepository(Booking);

        const payment = paymentRepository.create({
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

        const savedPayment = await paymentRepository.save(payment);

        if (dto.paymentMethod === PaymentMethod.CARD) {
          booking.status = BookingStatus.ACTIVE;
          await bookingRepository.save(booking);
        }

        return savedPayment;
      });
    }

    // Appointment payments (new)
    const appointment = await this.appointmentBookingRepo.findOne({
      where: { id: dto.appointmentId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.userId !== userId) {
      throw new NotFoundException('Appointment not found or does not belong to your account');
    }
    if (appointment.status !== AppointmentBookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Appointment is not pending payment');
    }

    const existingPending = await this.paymentRepo.findOne({
      where: { appointmentId: appointment.id, status: PaymentStatus.PENDING_APPROVAL },
      order: { createdAt: 'DESC' },
    });
    if (existingPending) {
      throw new BadRequestException('A bank transfer payment is already pending approval');
    }

    const amount = 1000;

    return this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(Payment);
      const appointmentRepository = manager.getRepository(AppointmentBooking);

      const payment = paymentRepository.create({
        bookingId: null,
        appointmentId: appointment.id,
        userId: familyMember.id,
        amount,
        paymentMethod: dto.paymentMethod,
        status:
          dto.paymentMethod === PaymentMethod.CARD
            ? PaymentStatus.PAID
            : PaymentStatus.PENDING_APPROVAL,
      });

      const savedPayment = await paymentRepository.save(payment);

      if (dto.paymentMethod === PaymentMethod.CARD) {
        appointment.status = AppointmentBookingStatus.CONFIRMED;
        await appointmentRepository.save(appointment);
      }

      return savedPayment;
    });
  }

  async getMyPayments(userId: string): Promise<Payment[]> {
    const familyMember = await this.familyRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!familyMember) throw new NotFoundException('Family member profile not found');

    return this.paymentRepo.find({
      where: { userId: familyMember.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING_APPROVAL,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async approvePayment(id: string): Promise<{ message: string; payment: Payment }> {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(Payment);
      const bookingRepository = manager.getRepository(Booking);
      const appointmentRepository = manager.getRepository(AppointmentBooking);

      const payment = await paymentRepository.findOne({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
        throw new BadRequestException('Only bank transfer payments require approval');
      }
      if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
        throw new BadRequestException('Payment is not pending approval');
      }

      payment.status = PaymentStatus.PAID;

      const updatedPayment = await paymentRepository.save(payment);

      if (payment.bookingId) {
        const booking = await bookingRepository.findOne({ where: { id: payment.bookingId } });
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status === BookingStatus.CANCELLED) {
          throw new BadRequestException('Cannot approve payment for a cancelled booking');
        }
        booking.status = BookingStatus.ACTIVE;
        await bookingRepository.save(booking);
      } else if (payment.appointmentId) {
        const appointment = await appointmentRepository.findOne({
          where: { id: payment.appointmentId },
        });
        if (!appointment) throw new NotFoundException('Appointment not found');
        appointment.status = AppointmentBookingStatus.CONFIRMED;
        await appointmentRepository.save(appointment);
      }

      return { message: 'Payment approved successfully', payment: updatedPayment };
    });
  }

  async rejectPayment(id: string): Promise<{ message: string; payment: Payment }> {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(Payment);
      const bookingRepository = manager.getRepository(Booking);
      const appointmentRepository = manager.getRepository(AppointmentBooking);

      const payment = await paymentRepository.findOne({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
        throw new BadRequestException('Only bank transfer payments can be rejected');
      }
      if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
        throw new BadRequestException('Payment is not pending approval');
      }

      payment.status = PaymentStatus.REJECTED;

      const updatedPayment = await paymentRepository.save(payment);

      if (payment.bookingId) {
        const booking = await bookingRepository.findOne({ where: { id: payment.bookingId } });
        if (!booking) throw new NotFoundException('Booking not found');
        booking.status = BookingStatus.CANCELLED;
        await bookingRepository.save(booking);
      } else if (payment.appointmentId) {
        const appointment = await appointmentRepository.findOne({
          where: { id: payment.appointmentId },
        });
        if (!appointment) throw new NotFoundException('Appointment not found');
        appointment.status = AppointmentBookingStatus.CANCELLED;
        await appointmentRepository.save(appointment);
      }

      return { message: 'Payment rejected successfully', payment: updatedPayment };
    });
  }
}
