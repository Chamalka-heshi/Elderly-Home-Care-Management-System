/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalRecord } from '../entities/vital-record.entity';
import { VitalRecordsService } from './vital-records.service';
import { VitalRecordsController } from './vital-records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VitalRecord])],
  controllers: [VitalRecordsController],
  providers: [VitalRecordsService],
  exports: [VitalRecordsService],
})
export class VitalRecordsModule {}
