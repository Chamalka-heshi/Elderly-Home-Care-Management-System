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