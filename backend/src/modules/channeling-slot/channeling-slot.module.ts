import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChannelingSlot } from './entities/channeling-slot.entity';
import { ChannelingSlotService } from './channeling-slot.service';
import { ChannelingSlotController } from './channeling-slot.controller';
import { Doctor } from '../doctors/entities/doctor.entity';

// Manages the lifecycle of clinical consultation windows, including creation by admin and acceptance by doctors.
@Module({
  imports: [TypeOrmModule.forFeature([ChannelingSlot, Doctor])],
  controllers: [ChannelingSlotController],
  providers: [ChannelingSlotService],
  // Exported so appointment and payment modules can verify slot availability before booking.
  exports: [ChannelingSlotService],
})
export class ChannelingSlotModule {}
