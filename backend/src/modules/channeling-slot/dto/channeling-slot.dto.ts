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

export class CreateChannelingSlotDto {
  @IsUUID()
  doctorId: string;

  /** YYYY-MM-DD */
  @IsDateString()
  date: string;

  /** HH:MM (24-hour) */
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM (24-hour)' })
  startTime: string;

  /** HH:MM (24-hour) */
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

  /** Care-home charge added by admin. Optional at creation. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  careHomeFee?: number;
}

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

  /** Admin can add / update the care-home charge on any slot. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  careHomeFee?: number;
}

/** Used by the doctor to update only the consultation fee on their slot. */
export class UpdateDoctorSlotFeeDto {
  @IsNumber()
  @Min(0)
  consultationFee: number;
}

export class QueryChannelingSlotsDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  /** Filter from this date (YYYY-MM-DD) */
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  /** Filter up to this date (YYYY-MM-DD) */
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;
}