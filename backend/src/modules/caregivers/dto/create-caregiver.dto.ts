/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class CreateCaregiverDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/, {
    message:
      'NIC must be valid Sri Lankan format (9 digits + V/X or 12 digits)',
  })
  nic?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;

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
}