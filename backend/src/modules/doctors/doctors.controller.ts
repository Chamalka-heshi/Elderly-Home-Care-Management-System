/* eslint-disable prettier/prettier */
import { Controller, Get, Param, UseGuards, Request, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.doctorsService.findByUserId(userId);
  }

  // ── NEW: Comprehensive Profile Update ──
  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.doctorsService.updateProfileByUserId(userId, dto);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  setAvailability(
    @Request() req: any,
    @Body() body: { availableDays: string[]; availableTimeStart: string; availableTimeEnd: string },
  ) {
    const userId = req.user.sub ?? req.user.userId ?? req.user.id;
    return this.doctorsService.setAvailability(userId, body.availableDays, body.availableTimeStart, body.availableTimeEnd);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}