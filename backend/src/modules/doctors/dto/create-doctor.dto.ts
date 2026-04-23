/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Matches,
} from 'class-validator';

export class CreateDoctorDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Contact number is required — it forms the user's temporary password:
   * CareHome@<contactNumber>. It is emailed to them on account creation.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber: string;

  /**
   * National Identity Card number — required for all doctor accounts.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/, {
    message: 'NIC must be valid Sri Lankan format (9 digits + V/X or 12 digits)',
  })
  nic: string;

  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  experienceYears: number;

  // Renamed from 'department' to match the entity field
  @IsOptional()
  @IsString()
  hospitalAffiliation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsArray()
  availableDays?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Available time start must be in HH:MM format',
  })
  availableTimeStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Available time end must be in HH:MM format',
  })
  availableTimeEnd?: string;

  // Internal — set by auth.service before calling doctorsService.create().
  // Never accepted from the HTTP request body.
  password?: string;
}
