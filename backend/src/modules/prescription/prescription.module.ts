// modules/prescription/prescription.module.ts
import { Module }                  from '@nestjs/common';
import { TypeOrmModule }           from '@nestjs/typeorm';
import { Prescription }            from './entities/prescription.entity';
import { Doctor }                  from '../doctors/entities/doctor.entity';  
import { PrescriptionService }     from './prescription.service';
import { PrescriptionsController } from './prescription.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([Prescription, Doctor])],          
  controllers: [PrescriptionsController],
  providers:   [PrescriptionService],
  exports:     [PrescriptionService],
})
export class PrescriptionsModule {}