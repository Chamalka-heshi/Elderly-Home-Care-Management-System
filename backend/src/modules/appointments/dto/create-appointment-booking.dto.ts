import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentBookingDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  caregiverId?: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @MaxLength(32)
  appointmentTime: string;
}

