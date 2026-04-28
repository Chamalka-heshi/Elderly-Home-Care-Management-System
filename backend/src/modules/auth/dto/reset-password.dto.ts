import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength 
} from 'class-validator';


// Processes the transition from a temporary recovery credential to a new permanent password after identity verification.
export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Temporary password is required.' })
  tempPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password.' })
  confirmPassword: string;
}
