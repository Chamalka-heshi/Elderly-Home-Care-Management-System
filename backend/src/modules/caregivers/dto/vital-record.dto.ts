/* eslint-disable prettier/prettier */
import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVitalRecordDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(30)
  @Max(250)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsIn(['Normal', 'Warning', 'Critical'])
  status?: string;
}

export class UpdateVitalRecordDto {
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsIn(['Normal', 'Warning', 'Critical'])
  status?: string;
}
