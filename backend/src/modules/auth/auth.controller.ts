import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Patch,
  UseInterceptors,
  UploadedFile,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { FamilySignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FirstLoginChangePasswordDto } from './dto/first-login-change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get cookieMaxAge(): number {
    return (
      this.configService.get<number>('app.jwt.cookieMaxAge') ??
      24 * 60 * 60 * 1000
    );
  }

  private cookieOptions(httpOnly: boolean) {
    const isProd =
      process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
    return {
      httpOnly,
      // SameSite=None + Secure is required for cross-origin cookie delivery
      // (frontend on localhost:5173 or a different domain → Render backend).
      // SameSite=Strict would silently drop the cookie on every cross-site request.
      // SameSite=Lax would drop it on cross-site subresource fetches (fetch/XHR).
      // In development (same-origin) Lax is sufficient and does not require HTTPS.
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: this.cookieMaxAge,
      path: '/',
    };
  }

  // Sets no-store cache headers on the response to prevent auth data from being
  // stored in browser history, shared caches, or CDN edge nodes.
  private setNoCacheHeaders(res: any): void {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
  }

  // Session Management
  // Registers a new family member account and creates their initial profile in the system.
  @Public()
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  @Post('family/signup')
  @HttpCode(HttpStatus.CREATED)
  async familySignup(@Body() dto: FamilySignupDto, @Response() res: any) {
    const result = await this.authService.familySignup(dto);

    this.setNoCacheHeaders(res);

    // Set secure, HttpOnly cookie with JWT token
    res.cookie('auth_token', result.token, this.cookieOptions(true));

    // Generate CSRF token and set as readable cookie (double-submit pattern)
    const csrfToken = this.authService.generateCsrfToken();
    res.cookie('csrf_token', csrfToken, this.cookieOptions(false));

    res.json({
      message: result.message,
      user: result.user,
    });
  }

  // Authenticates existing users with email/password and issues a JWT for session management.
  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Response() res: any) {
    const result = await this.authService.login(dto);

    this.setNoCacheHeaders(res);

    // Set secure, HttpOnly cookie with JWT token
    res.cookie('auth_token', result.token, this.cookieOptions(true));

    // Generate CSRF token and set as readable cookie (double-submit pattern)
    const csrfToken = this.authService.generateCsrfToken();
    res.cookie('csrf_token', csrfToken, this.cookieOptions(false));

    res.json({
      message: result.message,
      user: result.user,
    });
  }

  // Facilitates third-party authentication via Firebase, linking external identities to local system accounts.
  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 Firebase auth attempts per minute
  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseAuth(@Body() dto: FirebaseAuthDto, @Response() res: any) {
    const result = await this.authService.firebaseAuth(dto.idToken);

    this.setNoCacheHeaders(res);

    // Set secure, HttpOnly cookie with JWT token
    res.cookie('auth_token', result.token, this.cookieOptions(true));

    // Generate CSRF token and set as readable cookie (double-submit pattern)
    const csrfToken = this.authService.generateCsrfToken();
    res.cookie('csrf_token', csrfToken, this.cookieOptions(false));

    return res.json({
      user: result.user,
      message: result.isNewUser
        ? 'Account created successfully'
        : 'Signed in successfully',
      isNewUser: result.isNewUser,
    });
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
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 forgot password attempts per minute
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.contactNumber);
  }

  // Finalizes the recovery process by replacing the temporary credential with a user-chosen permanent password.
  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 password reset attempts per minute
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto, @Response() res: any) {
    const result = await this.authService.resetPassword(
      dto.email,
      dto.tempPassword,
      dto.newPassword,
      dto.confirmPassword,
    );

    this.setNoCacheHeaders(res);

    // Set secure, HttpOnly cookie with JWT token
    res.cookie('auth_token', result.token, this.cookieOptions(true));

    // Generate CSRF token and set as readable cookie (double-submit pattern)
    const csrfToken = this.authService.generateCsrfToken();
    res.cookie('csrf_token', csrfToken, this.cookieOptions(false));

    return res.json({
      user: result.user,
    });
  }

  // Profile & Security
  // Invalidates the current session token to ensure secure account sign-out.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser('sub') userId: string, @Response() res: any) {
    await this.authService.logout(userId);

    this.setNoCacheHeaders(res);

    const isProd =
      process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
    const clearOpts = {
      path: '/',
      secure: isProd,
      // Attributes must exactly match those used in Set-Cookie or the browser ignores the clear.
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    };

    res.clearCookie('auth_token', { ...clearOpts, httpOnly: true });
    res.clearCookie('csrf_token', { ...clearOpts, httpOnly: false });

    return res.json({ message: 'Logged out successfully' });
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
      throw new UnauthorizedException(
        'Authentication failed - no user ID in token',
      );
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

    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
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
    if (!file) throw new UnauthorizedException('No file uploaded');
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
