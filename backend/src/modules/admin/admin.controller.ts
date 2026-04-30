import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Request,
  HttpStatus,
} from '@nestjs/common';
import * as generator from 'generate-password';

import { AdminService }          from './admin.service';
import { DoctorsService }        from '../doctors/doctors.service';
import { CaregiversService }     from '../caregivers/caregivers.service';
import { UsersService }          from '../users/users.service';
import { MailService }           from '../mail/mail.service';
import { CreateAdminDto }        from './dto/create-admin.dto';
import { CreateDoctorDto }       from '../doctors/dto/create-doctor.dto';
import { CreateCaregiverDto }    from '../caregivers/dto/create-caregiver.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { Roles }                 from '../../common/decorators/roles.decorator';
import { UserRole }              from '../../common/enums/user-role.enum';

const TEMP_PASSWORD_LENGTH = 12;

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService:      AdminService,
    private readonly doctorsService:    DoctorsService,
    private readonly caregiversService: CaregiversService,
    private readonly usersService:      UsersService,
    private readonly mailService:       MailService,
  ) {}

  // Ensures at least one character from each category for security compliance.
  private generateTempPassword(): string {
    return generator.generate({
      length:    TEMP_PASSWORD_LENGTH,
      numbers:   true,
      uppercase: true,
      lowercase: true,
      symbols:   true,
      strict:    true,
    });
  }

  // Dashboard

  // Returns aggregated system-wide counts used by the admin dashboard home.
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Admin Management
  // Creates a new admin account and emails the temporary password so the user can log in.
  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Body() dto: CreateAdminDto) {
    const tempPassword = this.generateTempPassword();

    const admin = await this.adminService.create({ ...dto, password: tempPassword });
    await this.usersService.setMustChangePassword(admin.user.id, true);

    await this.mailService.sendAccountCredentials(
      dto.email,
      dto.fullName,
      'Admin',
      tempPassword,
    );

    return {
      message: `Admin created. Login credentials have been sent to ${dto.email}`,
      admin: {
        id:            admin.id,
        fullName:      admin.user.fullName,
        email:         admin.user.email,
        contactNumber: admin.user.contactNumber,
        nic:           admin.nic,
        isActive:      admin.user.isActive,
        createdAt:     admin.user.createdAt,
      },
    };
  }

  // Permanently removes an admin account; restricted to super-admins to prevent self-deletion escalation.
  @Delete('admins/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteAdmin(@Param('id') id: string) {
    await this.adminService.deleteAdmin(id);
    return { message: 'Admin account deleted successfully' };
  }

  // Returns all admin accounts for the super-admin user management panel.
  @Get('admins')
  async getAllAdmins() {
    const admins = await this.adminService.findAll();

    return {
      admins: admins.map((admin) => ({
        id:            admin.id,
        fullName:      admin.user.fullName,
        email:         admin.user.email,
        contactNumber: admin.user.contactNumber,
        nic:           admin.nic,
        isActive:      admin.user.isActive,
        createdAt:     admin.user.createdAt,
      })),
      total: admins.length,
    };
  }

  // Doctor Management
  // Creates a doctor account with a temporary password so the doctor receives credentials immediately.
  @Post('doctors')
  @HttpCode(HttpStatus.CREATED)
  async createDoctor(@Body() dto: CreateDoctorDto) {
    const tempPassword = this.generateTempPassword();

    const doctor = await this.doctorsService.create({ ...dto, password: tempPassword });
    await this.usersService.setMustChangePassword(doctor.user.id, true);

    await this.mailService.sendAccountCredentials(
      dto.email,
      dto.fullName,
      'Doctor',
      tempPassword,
    );

    return {
      message: `Doctor created. Login credentials have been sent to ${dto.email}`,
      doctor: {
        id:                  doctor.id,
        fullName:            doctor.user.fullName,
        email:               doctor.user.email,
        contactNumber:       doctor.user.contactNumber,
        nic:                 doctor.nic,
        specialization:      doctor.specialization,
        licenseNumber:       doctor.licenseNumber,
        experienceYears:     doctor.experienceYears,
        hospitalAffiliation: doctor.hospitalAffiliation,
        isActive:            doctor.user.isActive,
      },
    };
  }

  // Returns all doctors for the admin management list view.
  @Get('doctors')
  async getAllDoctors() {
    const doctors = await this.doctorsService.findAll();

    return {
      doctors: doctors.map((doctor) => ({
        id:                  doctor.id,
        fullName:            doctor.user.fullName,
        email:               doctor.user.email,
        contactNumber:       doctor.user.contactNumber,
        specialization:      doctor.specialization,
        licenseNumber:       doctor.licenseNumber,
        yearsOfExperience:   doctor.experienceYears,
        hospitalAffiliation: doctor.hospitalAffiliation || 'N/A',
        availableDays:       doctor.availableDays ?? [],
        availableTimeStart:  doctor.availableTimeStart ?? null,
        availableTimeEnd:    doctor.availableTimeEnd ?? null,
        isActive:            doctor.user.isActive,
        createdAt:           doctor.user.createdAt,
      })),
      total: doctors.length,
    };
  }

  // Blocks a doctor from accepting new appointments without deleting their history.
  @Delete('doctors/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateDoctor(@Param('id') id: string) {
    await this.doctorsService.deactivate(id);
    return { message: 'Doctor deactivated successfully' };
  }

  // Re-enables a previously deactivated doctor account.
  @Patch('doctors/:id/activate')
  async activateDoctor(@Param('id') id: string) {
    await this.doctorsService.activate(id);
    return { message: 'Doctor activated successfully' };
  }

  // Caregiver Management
  // Creates a caregiver account and emails credentials so they can log in immediately.
  @Post('caregivers')
  @HttpCode(HttpStatus.CREATED)
  async createCaregiver(@Body() dto: CreateCaregiverDto) {
    const tempPassword = this.generateTempPassword();

    const caregiver = await this.caregiversService.create({
      ...dto,
      password: tempPassword,
    });
    await this.usersService.setMustChangePassword(caregiver.user.id, true);

    await this.mailService.sendAccountCredentials(
      dto.email,
      dto.fullName,
      'Caregiver',
      tempPassword,
    );

    return {
      message: `Caregiver created. Login credentials have been sent to ${dto.email}`,
      caregiver: {
        id:              caregiver.id,
        fullName:        caregiver.user.fullName,
        email:           caregiver.user.email,
        contactNumber:   caregiver.user.contactNumber,
        nic:             caregiver.nic,
        specializations: caregiver.specializations,
        experienceYears: caregiver.experienceYears,
        isActive:        caregiver.user.isActive,
      },
    };
  }

  // Returns all caregivers for the admin management list view.
  @Get('caregivers')
  async getAllCaregivers() {
    const caregivers = await this.caregiversService.findAll();

    return {
      caregivers: caregivers.map((caregiver) => ({
        id:                caregiver.id,
        fullName:          caregiver.user.fullName,
        email:             caregiver.user.email,
        contactNumber:     caregiver.user.contactNumber,
        specializations:   caregiver.specializations || [],
        availableShifts:   caregiver.availableShifts || [],
        yearsOfExperience: caregiver.experienceYears || 0,
        isActive:          caregiver.user.isActive,
        createdAt:         caregiver.user.createdAt,
      })),
      total: caregivers.length,
    };
  }

  // Blocks a caregiver from being assigned to patients without deleting their records.
  @Delete('caregivers/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateCaregiver(@Param('id') id: string) {
    await this.caregiversService.deactivate(id);
    return { message: 'Caregiver deactivated successfully' };
  }

  // Re-enables a previously deactivated caregiver account.
  @Patch('caregivers/:id/activate')
  async activateCaregiver(@Param('id') id: string) {
    await this.caregiversService.activate(id);
    return { message: 'Caregiver activated successfully' };
  }

  // Family Management
  // Returns all registered family accounts for the admin oversight panel.
  @Get('families')
  async getAllFamilies() {
    return this.adminService.getAllFamilies();
  }

  // Activates or blocks a family account; affects login access for the entire family.
  @Patch('families/:id/status')
  async toggleFamilyStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const family = await this.adminService.toggleFamilyStatus(id, isActive);
    return {
      message: `Family ${isActive ? 'activated' : 'blocked'} successfully`,
      family,
    };
  }

  // Patient Management
  // Returns all patients across all family accounts for admin-level oversight.
  @Get('patients')
  async getAllPatients() {
    return this.adminService.getAllPatients();
  }

  // Returns a single patient's full medical profile for admin review.
  @Get('patients/:id')
  async getPatient(@Param('id') id: string) {
    return this.adminService.getPatientById(id);
  }

  // Permanently deletes a patient record; used only when data removal is explicitly requested.
  @Delete('patients/:id')
  @HttpCode(HttpStatus.OK)
  async deletePatient(@Param('id') id: string) {
    await this.adminService.deletePatient(id);
    return { message: 'Patient deleted successfully' };
  }

  // Admin Profile
  // Allows the logged-in admin to update their own name and contact number.
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    const userId = req.user.sub;
    return this.adminService.updateProfileByUserId(userId, dto);
  }
}