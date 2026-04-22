/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationLog } from '../entities/medication-log.entity';
import { MedicationLogsService } from './medication-logs.service';
import { MedicationLogsController } from './medication-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicationLog])],
  controllers: [MedicationLogsController],
  providers: [MedicationLogsService],
  exports: [MedicationLogsService],
})
export class MedicationLogsModule {}
