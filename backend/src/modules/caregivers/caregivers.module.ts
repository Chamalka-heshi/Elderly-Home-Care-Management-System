/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaregiversService } from './caregivers.service';
import { CaregiversController } from './caregivers.controller';
import { Caregiver } from './entities/caregiver.entity';
import { UsersModule } from '../users/users.module';
import { CareNotesModule } from './care-notes/care-notes.module';
import { VitalRecordsModule } from './vital-records/vital-records.module';
import { MedicationLogsModule } from './medication-logs/medication-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Caregiver]),
    UsersModule,
    CareNotesModule,
    VitalRecordsModule,
    MedicationLogsModule,
  ],
  controllers: [CaregiversController],
  providers: [CaregiversService],
  exports: [CaregiversService],
})
export class CaregiversModule {}