import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsArray, 
  Matches 
} from 'class-validator';

export class UpdateDoctorProfileDto {
  // ── Base User Fields ──
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;

  // ── Doctor Professional Fields ──
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