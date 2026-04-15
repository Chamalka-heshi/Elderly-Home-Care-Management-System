/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Request,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // ── Authenticated (any logged-in user) ────────────────────────────────────

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('me')
  getMe(@Request() req: any) {
    const userId = req.user.sub;
    return this.doctorsService.findByUserId(userId);
  }

  // ── Doctor Dashboard Home ─────────────────────────────────────────────────

  /**
   * GET /doctors/dashboard
   * Returns aggregated stats + recent patients for the doctor's home page.
   * Requires DOCTOR role.
   */
  @Get('dashboard')
  @Roles(UserRole.DOCTOR)
  getDashboard(@Request() req: any) {
    const userId = req.user.sub;
    return this.doctorsService.getDashboardStats(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  // ── Doctor only ───────────────────────────────────────────────────────────

  @Patch('profile')
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    const userId = req.user.sub;
    return this.doctorsService.updateProfileByUserId(userId, dto);
  }

  @Patch('me/availability')
  @Roles(UserRole.DOCTOR)
  setAvailability(
    @Request() req: any,
    @Body()
    body: {
      availableDays: string[];
      availableTimeStart: string;
      availableTimeEnd: string;
    },
  ) {
    const userId = req.user.sub;
    return this.doctorsService.setAvailability(
      userId,
      body.availableDays,
      body.availableTimeStart,
      body.availableTimeEnd,
    );
  }
}