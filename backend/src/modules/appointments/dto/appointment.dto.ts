import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';

import { AppointmentStatus } from '../entities/appointment.entity';

// Captures the essential relationship between a time slot and a patient to initiate the booking process.
export class CreateAppointmentDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Status DTO

// Validates the transition between appointment stages, ensuring only recognized system statuses are applied.
export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Query Appointments DTO

// Provides optional filtering criteria for listing appointments based on status, doctor, or patient identifiers.
export class QueryAppointmentsDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
