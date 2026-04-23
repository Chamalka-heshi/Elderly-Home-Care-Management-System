/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Contact number is required — it forms part of the auto-generated
   * temporary password sent to the new admin's email address.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber: string;

  /**
   * National Identity Card number — required for all admin accounts.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9}[vVxX]$|^[0-9]{12}$/, {
    message: 'NIC must be valid Sri Lankan format (9 digits + V/X or 12 digits)',
  })
  nic: string;
}
