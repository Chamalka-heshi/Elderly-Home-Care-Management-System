import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Matches,
  IsUUID,
  IsNumber,
} from 'class-validator';

import { SlotStatus } from '../entities/channeling-slot.entity';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Validates the parameters for proposing a new consultation window, ensuring doctor availability and system-enforced scheduling constraints.
export class CreateChannelingSlotDto {
  @IsUUID()
  doctorId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24-hour)' })
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24-hour)' })
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  bookingCutoffMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxPatients?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  careHomeFee?: number;
}

// Update Slot DTO

// Allows administrators to modify existing slot details while maintaining temporal and status consistency.
export class UpdateChannelingSlotDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24-hour)' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM (24-hour)' })
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  bookingCutoffMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxPatients?: number;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  careHomeFee?: number;
}

// Doctor Fee Update DTO

// Permits clinical staff to define their own professional charges for a specific availability window.
export class UpdateDoctorSlotFeeDto {
  @IsNumber()
  @Min(0)
  consultationFee: number;
}
