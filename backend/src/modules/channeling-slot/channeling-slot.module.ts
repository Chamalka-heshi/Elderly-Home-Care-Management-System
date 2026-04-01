import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelingSlot } from './entities/channeling-slot.entity';
import { ChannelingSlotService } from './channeling-slot.service';
import { ChannelingSlotController } from './channeling-slot.controller';
import { Doctor } from '../doctors/entities/doctor.entity'; // Cleaned up relative path

@Module({
  imports: [TypeOrmModule.forFeature([ChannelingSlot, Doctor])],
  controllers: [ChannelingSlotController],
  providers: [ChannelingSlotService],
  exports: [ChannelingSlotService],
})
export class ChannelingSlotModule {}