import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Defines the required fields for user authentication to prevent invalid or malicious login attempts.
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
