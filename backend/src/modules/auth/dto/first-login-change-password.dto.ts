import { 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  Matches 
} from 'class-validator';


// Used on the forced first-login password change screen. No currentPassword is required — the backend verifies mustChangePassword === true before accepting this request.
export class FirstLoginChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
