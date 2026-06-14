import { IsString, IsOptional, IsNumber, Min, Matches } from 'class-validator';

// Allows clinical professionals to maintain their own professional details and contact information while enforcing system safety rules.
export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;
}
