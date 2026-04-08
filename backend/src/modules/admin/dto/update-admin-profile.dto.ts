/* eslint-disable prettier/prettier */
import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;
}