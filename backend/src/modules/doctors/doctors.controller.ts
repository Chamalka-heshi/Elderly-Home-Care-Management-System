import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { DoctorsService }         from './doctors.service';
import { Roles }                  from '../../common/decorators/roles.decorator';
import { UserRole }               from '../../common/enums/user-role.enum';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { GetUser }                from '../../common/decorators/current-user.decorator';


// Manages the private workspace and profile of clinical professionals, providing tools for session tracking and availability.
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // Retrieves high-level metrics and upcoming session summaries for the doctor's personal management view.
  @Get('dashboard')
  @Roles(UserRole.DOCTOR)
  getDashboard(@GetUser('sub') userId: string) {
    return this.doctorsService.getDashboardStats(userId);
  }

  // Permits doctors to update their professional details, including specialization and consultation fees.
  @Patch('profile')
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @GetUser('sub') userId: string,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    const result = await this.doctorsService.updateProfileByUserId(userId, dto);
    return { message: 'Profile updated successfully', ...result };
  }

  // Allows clinical staff to define their standard working hours and days to guide administrative scheduling.
  @Patch('me/availability')
  @Roles(UserRole.DOCTOR)
  setAvailability(
    @GetUser('sub') userId: string,
    @Body() body: {
      availableDays:      string[];
      availableTimeStart: string;
      availableTimeEnd:   string;
    },
  ) {
    return this.doctorsService.setAvailability(
      userId,
      body.availableDays,
      body.availableTimeStart,
      body.availableTimeEnd,
    );
  }
}