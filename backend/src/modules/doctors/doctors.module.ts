/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { Doctor } from './entities/doctor.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), UsersModule],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}