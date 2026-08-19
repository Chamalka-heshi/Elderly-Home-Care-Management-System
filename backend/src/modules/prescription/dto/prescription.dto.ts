import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
  IsNotEmpty,
  IsIn,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

// Describes the clinical action the doctor performed so the email can reflect the true event.
export type PrescriptionEmailAction = 'NEW' | 'CONTINUED' | 'CANCELLED_AND_REPLACED';
import { Type } from 'class-transformer';

// Medicine DTO
// Validates individual medication entries, enforcing strict dosage, frequency, and duration constraints for patient safety.
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

// Create Prescription DTO
// Captures all clinical and administrative data required to issue a new medical instruction, including nested medication details.
export class CreatePrescriptionDto {
  @IsOptional()
  appointmentId?: string;

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

  // The collection of specific medications and treatments prescribed during the session.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicineDto)
  medicines: CreateMedicineDto[];

  // Indicates what clinical action the doctor performed, used exclusively for tailoring the email notification.
  @IsIn(['NEW', 'CONTINUED', 'CANCELLED_AND_REPLACED'])
  @IsOptional()
  action?: PrescriptionEmailAction;

  // The UUID of the prescription that was cancelled or continued, used to load it for the email.
  @IsUUID()
  @IsOptional()
  previousPrescriptionId?: string;
}

// Update Prescription DTO
// Allows for clinical modifications to existing instructions while maintaining historical audit trails and status consistency.
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

// Prescription Query DTO
// Supports efficient retrieval of medical records through status, patient, and chronological pagination filters.
export class PrescriptionQueryDto {
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

// Defines the unified response structure for paginated clinical data across the professional and family portals.
export interface PrescriptionListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
