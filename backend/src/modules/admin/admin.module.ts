/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { UsersModule } from '../users/users.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { CaregiversModule } from '../caregivers/caregivers.module';
import { Patient } from '../patients/entities/patient.entity';
import { FamilyMember } from '../family/entities/family-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Patient, FamilyMember]),
    UsersModule,
    DoctorsModule,
    CaregiversModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}