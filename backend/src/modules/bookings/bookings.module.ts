import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CarePlan } from '../care-plan/entities/care-plan.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, FamilyMember, Patient, CarePlan]),
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
