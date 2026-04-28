import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';


// Validates the incoming request payload when creating a new admin account to ensure identity and contact data integrity.
export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/, {
    message: 'NIC must be valid Sri Lankan format (9 digits + V/X or 12 digits)',
  })
  nic: string;

  // This field is populated internally during the registration flow and is not exposed to the public API.
  password?: string;
}
