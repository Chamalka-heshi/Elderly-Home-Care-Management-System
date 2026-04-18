// src/modules/prescription/dto/prescription.dto.ts
import {
  IsString, IsNumber, IsOptional, IsArray, IsInt,
  ValidateNested, IsNotEmpty, IsIn, IsDateString, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Medicine DTO ──────────────────────────────────────────────────────────────

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsNumber()
  @Min(1)
  @Max(365)
  durationDays: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}

// ── Create Prescription ───────────────────────────────────────────────────────
// doctorId is injected by the service from the JWT — NOT sent by the client.
// patientId is a plain string reference — no patient table FK required.

export class CreatePrescriptionDto {
  // Appointment this prescription is for (optional — auto-completes appointment)
  @IsOptional()
  appointmentId?: string;

  // Patient details (stored as plain strings — no patient table FK)
  @IsString()
  @IsOptional()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsNumber()
  @Min(0)
  @Max(130)
  patientAge: number;

  // Clinical
  @IsDateString()
  issuedDate: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Medicines
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicineDto)
  medicines: CreateMedicineDto[];
}

// ── Update Prescription ───────────────────────────────────────────────────────

export class UpdatePrescriptionDto {
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsIn(['active', 'completed', 'discontinued'])
  @IsOptional()
  status?: 'active' | 'completed' | 'discontinued';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicineDto)
  @IsOptional()
  medicines?: CreateMedicineDto[];
}

// ── Query DTO ─────────────────────────────────────────────────────────────────

export class PrescriptionQueryDto {
  // patientId filter — plain string, no UUID format enforced
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsIn(['active', 'completed', 'discontinued'])
  @IsOptional()
  status?: 'active' | 'completed' | 'discontinued';

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ── Response shape ────────────────────────────────────────────────────────────

export interface PrescriptionListResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}