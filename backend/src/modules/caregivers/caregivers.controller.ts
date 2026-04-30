/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { UpdateCaregiverProfileDto } from './dto/update-caregiver-profile.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { GetUser } from '../../common/decorators/current-user.decorator';

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  /**
   * GET /caregivers/me
   * Returns the full caregiver profile for the currently logged-in caregiver.
   */

  /**
   * PATCH /caregivers/profile
   * Lets the logged-in caregiver update their own profile fields.
   * They cannot change their email, NIC, or account status.
   */
  @Patch('profile')
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @GetUser('sub') userId: string,
    @Body() dto: UpdateCaregiverProfileDto,
  ) {
    const updated = await this.caregiversService.updateProfileByUserId(
      userId,
      dto,
    );
    return {
      message:         'Profile updated successfully',
      id:              updated.id,
      fullName:        updated.user.fullName,
      email:           updated.user.email,
      contactNumber:   updated.user.contactNumber,
      address:         updated.address,
      qualification:   updated.qualification,
      experienceYears: updated.experienceYears,
      specializations: updated.specializations  ?? [],
      availableShifts: updated.availableShifts  ?? [],
      emergencyContact:updated.emergencyContact,
    };
  }

  /**
   * GET /caregivers
   * Returns all active caregivers.
   * Used by admin and doctors to list caregivers.
   */
}
