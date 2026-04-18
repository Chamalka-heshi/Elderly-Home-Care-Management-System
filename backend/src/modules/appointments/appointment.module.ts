import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { ChannelingSlot } from '../channeling-slot/entities/channeling-slot.entity';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      ChannelingSlot,
      Patient,
      FamilyMember,
      Doctor,
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}