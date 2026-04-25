/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule }      from '@nestjs/typeorm';
import { PatientsService }    from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient }            from './entities/patient.entity';
import { FamilyMember }       from '../family/entities/family-member.entity';
import { FamilyModule }       from '../family/family.module';
import { VitalRecord }        from '../caregivers/entities/vital-record.entity';
import { Prescription }       from '../prescription/entities/prescription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, FamilyMember, VitalRecord, Prescription]),
    forwardRef(() => FamilyModule),
  ],
  controllers: [PatientsController],
  providers:   [PatientsService],
  exports:     [PatientsService],
})
export class PatientsModule {}