import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Logger,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FamilySignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';

interface JwtUser {
  sub: string;
  email: string;
  role: UserRole;
  contactNumber: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /* =========================================================
     PUBLIC ROUTES — no JWT required
  ========================================================= */

  @Public()
  @Post('family/signup')
  @HttpCode(HttpStatus.CREATED)
  async familySignup(@Body() dto: FamilySignupDto) {
    return this.authService.familySignup(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseAuth(@Body() dto: FirebaseAuthDto) {
    const result = await this.authService.firebaseAuth(dto.idToken);
    return {
      token:     result.token,
      user:      result.user,
      message:   result.isNewUser
        ? 'Account created successfully'
        : 'Signed in successfully',
      isNewUser: result.isNewUser,
    };
  }

  /* =========================================================
     AUTHENTICATED ROUTES — JWT enforced by global APP_GUARD
  ========================================================= */

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: { user: JwtUser }) {
    this.logger.log(`Getting profile - req.user: ${JSON.stringify(req.user)}`);

    const userId = req.user.sub;
    if (!userId) {
      this.logger.error('No user ID found in JWT token');
      throw new UnauthorizedException('Authentication failed');
    }

    return this.authService.getProfile(userId);
  }

  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req: { user: JwtUser }) {
    this.logger.log(
      `Delete account - Full req.user: ${JSON.stringify(req.user)}`,
    );
    const userId = req.user.sub;
    if (!userId) {
      this.logger.error('No user ID found in JWT token');
      this.logger.error(`JWT Payload received: ${JSON.stringify(req.user)}`);
      throw new UnauthorizedException(
        'Authentication failed - no user ID in token',
      );
    }

    this.logger.log(`✅ Deleting account for userId: ${userId}`);
    return this.authService.deleteAccount(userId);
  }
  /* =========================================================
     FAMILY ONLY ROUTES
  ========================================================= */

  @Post('family/create-patient')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() dto: CreatePatientDto,
    @Request() req: { user: JwtUser },
  ) {
    const userId = req.user.sub;
    return this.authService.createPatient(dto, userId);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: { user: JwtUser },
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication failed');
    }

    await this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);

    return { message: 'Password updated successfully' };
  }
}
