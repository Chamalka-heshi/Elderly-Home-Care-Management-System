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
}
