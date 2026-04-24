import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentBooking } from './entities/appointment-booking.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentBookingController } from './appointment-booking.controller';
import { AppointmentBookingService } from './appointment-booking.service';
import { ChannelingSlot } from '../channeling-slot/entities/channeling-slot.entity';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentBooking,
      ChannelingSlot,
      Patient,
      FamilyMember,
      Doctor,
    ]),
  ],
  controllers: [AppointmentController, AppointmentBookingController],
  providers: [AppointmentService, AppointmentBookingService],
  exports: [AppointmentService, AppointmentBookingService],
})
export class AppointmentModule {}