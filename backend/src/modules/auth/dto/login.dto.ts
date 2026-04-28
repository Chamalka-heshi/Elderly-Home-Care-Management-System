import { 
  IsEmail, 
  IsNotEmpty, 
  IsString 
} from 'class-validator';


// Defines the required fields for user authentication to prevent invalid or malicious login attempts.
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
