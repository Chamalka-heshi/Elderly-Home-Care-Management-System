/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaregiversService } from './caregivers.service';
import { Caregiver } from './entities/caregiver.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Caregiver]), UsersModule],
  providers: [CaregiversService],
  exports: [CaregiversService],
})
export class CaregiversModule {}