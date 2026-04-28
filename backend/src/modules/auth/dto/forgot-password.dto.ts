import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength 
} from 'class-validator';


// Mandates both email and contact number to provide a secondary layer of identity verification before resetting credentials.
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact number is required.' })
  @MinLength(7, { message: 'Contact number must be at least 7 digits.' })
  contactNumber: string;
}
