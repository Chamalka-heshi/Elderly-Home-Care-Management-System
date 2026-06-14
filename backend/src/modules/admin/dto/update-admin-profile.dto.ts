import { IsString, IsOptional, Matches } from 'class-validator';

// Defines optional fields that an admin can modify on their own profile while enforcing data format constraints.
export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;
}
