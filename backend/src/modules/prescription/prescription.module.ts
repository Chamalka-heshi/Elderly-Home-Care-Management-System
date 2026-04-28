import { Module }                  from '@nestjs/common';
import { TypeOrmModule }           from '@nestjs/typeorm';

import { Prescription }            from './entities/prescription.entity';
import { PrescriptionService }     from './prescription.service';
import { PrescriptionsController } from './prescription.controller';
import { Doctor }                  from '../doctors/entities/doctor.entity';
import { FamilyMember }            from '../family/entities/family-member.entity';
import { Patient }                 from '../patients/entities/patient.entity';
import { Appointment }             from '../appointments/entities/appointment.entity';
import { MailModule }              from '../mail/mail.module';


// Bridges clinical decision-making with patient treatment records and family notification systems to ensure coordinated care delivery.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prescription, 
      Doctor, 
      FamilyMember, 
      Patient, 
      Appointment
    ]),
    MailModule,
  ],
  controllers: [PrescriptionsController],
  providers:   [PrescriptionService],
  exports:     [PrescriptionService],
})
export class PrescriptionsModule {}