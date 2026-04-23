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

export class CreateCaregiverDto {
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
   * National Identity Card number — required for all caregiver accounts.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/, {
    message: 'NIC must be valid Sri Lankan format (9 digits + V/X or 12 digits)',
  })
  nic: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  yearsOfExperience: number;

  @IsNotEmpty()
  @IsArray()
  certifications: string[];

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Emergency contact must be 10 digits',
  })
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  shiftPreference?: 'day' | 'night' | 'flexible';

  @IsOptional()
  @IsString()
  availabilityStatus?: 'available' | 'busy' | 'off-duty';

  @IsOptional()
  @IsArray()
  availableShifts?: string[];

  // Internal — set by auth.service before calling caregiversService.create().
  // Never accepted from the HTTP request body.
  password?: string;
}
