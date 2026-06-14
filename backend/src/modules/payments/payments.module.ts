import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Booking,
      FamilyMember,
      Appointment, // ← was AppointmentBooking (wrong entity); fixed to Appointment
    ]),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
