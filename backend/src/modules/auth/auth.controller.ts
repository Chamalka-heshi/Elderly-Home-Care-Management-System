import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Query,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage }    from 'multer';

import { AuthService }                 from './auth.service';
import { FamilySignupDto }             from './dto/signup.dto';
import { LoginDto }                    from './dto/login.dto';
import { FirebaseAuthDto }             from './dto/firebase-auth.dto';
import { ChangePasswordDto }           from './dto/change-password.dto';
import { FirstLoginChangePasswordDto } from './dto/first-login-change-password.dto';
import { ForgotPasswordDto }           from './dto/forgot-password.dto';
import { ResetPasswordDto }            from './dto/reset-password.dto';
import { Roles }                       from '../../common/decorators/roles.decorator';
import { Public }                      from '../../common/decorators/public.decorator';
import { UserRole }                    from '../../common/enums/user-role.enum';
import { GetUser }                     from '../../common/decorators/current-user.decorator';

interface JwtUser {
  sub:           string;
  email:         string;
  role:          UserRole;
  contactNumber: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // Session Management
  // Registers a new family member account and creates their initial profile in the system.
  @Public()
  @Post('family/signup')
  @HttpCode(HttpStatus.CREATED)
  async familySignup(@Body() dto: FamilySignupDto) {
    return this.authService.familySignup(dto);
  }

  // Authenticates existing users with email/password and issues a JWT for session management.
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Facilitates third-party authentication via Firebase, linking external identities to local system accounts.
  @Public()
  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseAuth(@Body() dto: FirebaseAuthDto) {
    const result = await this.authService.firebaseAuth(dto.idToken);
    return {
      token:     result.token,
      user:      result.user,
      message:   result.isNewUser ? 'Account created successfully' : 'Signed in successfully',
      isNewUser: result.isNewUser,
    };
  }

  // Password Recovery
  // Validates email existence and provides a masked hint of the contact number to assist user verification.
  @Public()
  @Get('forgot-password/check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmailForReset(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required.');
    }
    return this.authService.checkEmailForReset(email);
  }

  // Initiates the reset flow by generating a temporary password after verifying the user's secret contact number.
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.contactNumber);
  }

  // Finalizes the recovery process by replacing the temporary credential with a user-chosen permanent password.
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.tempPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  // Profile & Security
  // Invalidates the current session token to ensure secure account sign-out.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser('sub') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  // Retrieves the complete profile of the authenticated user based on their JWT identity.
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetUser('sub') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication failed');
    }
    return this.authService.getProfile(userId);
  }

  // Permits users to remove their account from the platform, including all associated personal data.
  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetUser('sub') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication failed - no user ID in token');
    }
    return this.authService.deleteAccount(userId);
  }

  // Allows authenticated users to update their password while ensuring they know the previous one.
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }

  // Enforces a required password reset for accounts created with temporary credentials during their first login.
  @Patch('first-login-change-password')
  @HttpCode(HttpStatus.OK)
  async firstLoginChangePassword(
    @GetUser('sub') userId: string,
    @Body() dto: FirstLoginChangePasswordDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication failed');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    await this.authService.firstLoginChangePassword(userId, dto.newPassword);
    return { message: 'Password set successfully. Welcome!' };
  }

  // Processes and stores user profile images to enhance visual identity across the dashboard.
  @Patch('upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  async uploadAvatar(
    @GetUser('sub') userId: string,
    @UploadedFile() file: { mimetype: string; size: number; buffer: Buffer },
  ) {
    if (!userId) throw new UnauthorizedException('Authentication failed');
    if (!file)   throw new UnauthorizedException('No file uploaded');
    return this.authService.uploadAvatar(userId, file);
  }

  // Removes the profile picture, reverting the user avatar to its default system state.
  @Delete('remove-avatar')
  @HttpCode(HttpStatus.OK)
  async removeAvatar(@GetUser('sub') userId: string) {
    if (!userId) throw new UnauthorizedException('Authentication failed');
    await this.authService.removeAvatar(userId);
    return { message: 'Avatar removed successfully' };
  }
}