/* eslint-disable prettier/prettier */
import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateMedicationLogDto {
  @IsUUID()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  medicationName: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsIn(['Administered', 'Pending', 'Missed', 'Refused'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicationLogDto {
  @IsOptional()
  @IsIn(['Administered', 'Pending', 'Missed', 'Refused'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
