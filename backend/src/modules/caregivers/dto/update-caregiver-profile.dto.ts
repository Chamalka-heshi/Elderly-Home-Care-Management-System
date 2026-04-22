/* eslint-disable prettier/prettier */
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCaregiverProfileDto {
  // ── Base User Fields ──────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;

  // ── Caregiver-specific Fields ─────────────────────────────────────────────
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  experienceYears?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Emergency contact must be 10 digits' })
  emergencyContact?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableShifts?: string[];
}
