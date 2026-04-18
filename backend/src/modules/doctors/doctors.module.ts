/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { Doctor } from './entities/doctor.entity';
import { UsersModule } from '../users/users.module';
import { Prescription } from '../prescription/entities/prescription.entity';
import { ChannelingSlot } from '../channeling-slot/entities/channeling-slot.entity';
import { Patient } from '../patients/entities/patient.entity';

import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Prescription, ChannelingSlot, Patient, Appointment]),
    UsersModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}