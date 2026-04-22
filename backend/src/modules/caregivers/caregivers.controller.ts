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

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  /**
   * GET /caregivers/me
   * Returns the full caregiver profile for the currently logged-in caregiver.
   */
  @Get('me')
  @Roles(UserRole.CAREGIVER)
  async getMe(@Request() req: any) {
    const caregiver = await this.caregiversService.findByUserId(req.user.id);
    if (!caregiver) {
      return { message: 'Caregiver profile not found' };
    }
    return {
      id:              caregiver.id,
      fullName:        caregiver.user.fullName,
      email:           caregiver.user.email,
      contactNumber:   caregiver.user.contactNumber,
      nic:             caregiver.nic,
      address:         caregiver.address,
      qualification:   caregiver.qualification,
      experienceYears: caregiver.experienceYears,
      specializations: caregiver.specializations  ?? [],
      availableShifts: caregiver.availableShifts  ?? [],
      emergencyContact:caregiver.emergencyContact,
      isActive:        caregiver.user.isActive,
      createdAt:       caregiver.user.createdAt,
    };
  }

  /**
   * PATCH /caregivers/profile
   * Lets the logged-in caregiver update their own profile fields.
   * They cannot change their email, NIC, or account status.
   */
  @Patch('profile')
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateCaregiverProfileDto,
  ) {
    const updated = await this.caregiversService.updateProfileByUserId(
      req.user.id,
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
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  async findAll() {
    const caregivers = await this.caregiversService.findAllActive();
    return {
      caregivers: caregivers.map((c) => ({
        id:              c.id,
        fullName:        c.user.fullName,
        email:           c.user.email,
        contactNumber:   c.user.contactNumber,
        specializations: c.specializations  ?? [],
        availableShifts: c.availableShifts  ?? [],
        experienceYears: c.experienceYears  ?? 0,
        isActive:        c.user.isActive,
      })),
      total: caregivers.length,
    };
  }
}
