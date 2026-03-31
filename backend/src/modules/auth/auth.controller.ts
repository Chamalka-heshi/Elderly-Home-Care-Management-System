import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FamilySignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateCaregiverDto } from '../caregivers/dto/create-caregiver.dto';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

interface JwtUser {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  role?: UserRole;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /* =========================================================
     PUBLIC ROUTES
  ========================================================= */

  @Post('family/signup')
  @HttpCode(HttpStatus.CREATED)
  async familySignup(@Body() dto: FamilySignupDto) {
    return this.authService.familySignup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── POST /api/auth/firebase ───────────────────────────────────────────────
  // Google sign-in via Firebase.
  // Firebase handles OAuth on the frontend; we verify the ID token here.
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
     AUTHENTICATED ROUTES
  ========================================================= */

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: { user: JwtUser }) {
    this.logger.log(`Getting profile - req.user: ${JSON.stringify(req.user)}`);

    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    if (!userId) {
      this.logger.error('No user ID found in JWT token');
      throw new UnauthorizedException('Authentication failed');
    }

    return this.authService.getProfile(userId);
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req: { user: JwtUser }) {
    this.logger.log(
      `Delete account - Full req.user: ${JSON.stringify(req.user)}`,
    );

    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    if (!userId) {
      this.logger.error('❌ No user ID found in JWT token');
      this.logger.error(`JWT Payload received: ${JSON.stringify(req.user)}`);
      throw new UnauthorizedException(
        'Authentication failed - no user ID in token',
      );
    }

    this.logger.log(`✅ Deleting account for userId: ${userId}`);
    return this.authService.deleteAccount(userId);
  }

  /* =========================================================
     ADMIN ONLY ROUTES
  ========================================================= */

  @Post('admin/create-doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createDoctor(
    @Body() dto: CreateDoctorDto,
    @Request() req: { user: JwtUser },
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.authService.createDoctor(dto, userId);
  }

  @Post('admin/create-caregiver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCaregiver(
    @Body() dto: CreateCaregiverDto,
    @Request() req: { user: JwtUser },
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.authService.createCaregiver(dto, userId);
  }

  @Post('admin/create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @Request() req: { user: JwtUser },
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.authService.createAdmin(dto, userId);
  }

  /* =========================================================
     FAMILY ONLY ROUTES
  ========================================================= */

  @Post('family/create-patient')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() dto: CreatePatientDto,
    @Request() req: { user: JwtUser },
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.authService.createPatient(dto, userId);
  }
}