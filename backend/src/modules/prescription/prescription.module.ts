// modules/prescription/prescription.module.ts
import { Module }                  from '@nestjs/common';
import { TypeOrmModule }           from '@nestjs/typeorm';
import { Prescription }            from './entities/prescription.entity';
import { Doctor }                  from '../doctors/entities/doctor.entity';
import { FamilyMember }            from '../family/entities/family-member.entity';
import { Patient }                 from '../patients/entities/patient.entity';
import { Appointment }             from '../appointments/entities/appointment.entity';
import { PrescriptionService }     from './prescription.service';
import { PrescriptionsController } from './prescription.controller';
import { MailModule }              from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription, Doctor, FamilyMember, Patient, Appointment]),
    MailModule,
  ],
  controllers: [PrescriptionsController],
  providers:   [PrescriptionService],
  exports:     [PrescriptionService],
})
export class PrescriptionsModule {}