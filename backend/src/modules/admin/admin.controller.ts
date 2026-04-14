/* eslint-disable prettier/prettier */
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
import { AdminService } from './admin.service';
import { DoctorsService } from '../doctors/doctors.service';
import { CaregiversService } from '../caregivers/caregivers.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { CreateCaregiverDto } from '../caregivers/dto/create-caregiver.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly doctorsService: DoctorsService,
    private readonly caregiversService: CaregiversService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  // ─── Helper ───────────────────────────────────────────────────────────────
  /** Temporary password = fixed prefix + contact number */
  private buildTempPassword(contactNumber: string): string {
    return `CareHome@${contactNumber}`;
  }

  // ============ DASHBOARD STATISTICS ============
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============ ADMIN MANAGEMENT ============

  @Post('admins')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const tempPassword = this.buildTempPassword(createAdminDto.contactNumber);

    // create() expects the DTO + an injected password
    const admin = await this.adminService.create({
      ...createAdminDto,
      password: tempPassword,
    });
    //admin.id - admin in
    //admin.user.id - user id
    // Force password change on first login
    await this.usersService.setMustChangePassword(admin.user.id, true);

    // Email credentials (non-blocking)
    await this.mailService.sendAccountCredentials(
      createAdminDto.email,
      createAdminDto.fullName,
      'Admin',
      createAdminDto.contactNumber,
    );

    return {
      message: `Admin created. Login credentials have been sent to ${createAdminDto.email}`,
      admin: {
        id: admin.id,
        fullName: admin.user.fullName,
        email: admin.user.email,
        contactNumber: admin.user.contactNumber,
        isActive: admin.user.isActive,
        createdAt: admin.user.createdAt,
      },
    };
  }

  @Get('admins')
  async getAllAdmins() {
    const admins = await this.adminService.findAll();

    return {
      admins: admins.map((admin) => ({
        id: admin.id,
        fullName: admin.user.fullName,
        email: admin.user.email,
        contactNumber: admin.user.contactNumber,
        isActive: admin.user.isActive,
        createdAt: admin.user.createdAt,
      })),
      total: admins.length,
    };
  }

  // ============ DOCTOR MANAGEMENT ============

  @Post('doctors')
  @HttpCode(HttpStatus.CREATED)
  async createDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    const tempPassword = this.buildTempPassword(createDoctorDto.contactNumber!);

    const doctor = await this.doctorsService.create({
      ...createDoctorDto,
      password: tempPassword,
    });

    await this.usersService.setMustChangePassword(doctor.user.id, true);

    await this.mailService.sendAccountCredentials(
      createDoctorDto.email,
      createDoctorDto.fullName,
      'Doctor',
      createDoctorDto.contactNumber!,
    );

    return {
      message: `Doctor created. Login credentials have been sent to ${createDoctorDto.email}`,
      doctor: {
        id: doctor.id,
        fullName: doctor.user.fullName,
        email: doctor.user.email,
        contactNumber: doctor.user.contactNumber,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        experienceYears: doctor.experienceYears,
        hospitalAffiliation: doctor.hospitalAffiliation,
        isActive: doctor.user.isActive,
      },
    };
  }

  @Get('doctors')
  async getAllDoctors() {
    const doctors = await this.doctorsService.findAll();

    return {
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        fullName: doctor.user.fullName,
        email: doctor.user.email,
        contactNumber: doctor.user.contactNumber,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        yearsOfExperience: doctor.experienceYears,
        hospitalAffiliation: doctor.hospitalAffiliation || 'N/A',
        isActive: doctor.user.isActive,
        createdAt: doctor.user.createdAt,
      })),
      total: doctors.length,
    };
  }

  @Get('doctors/:id')
  async getDoctor(@Param('id') id: string) {
    const doctor = await this.doctorsService.findOne(id);

    return {
      id: doctor.id,
      fullName: doctor.user.fullName,
      email: doctor.user.email,
      contactNumber: doctor.user.contactNumber,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.experienceYears,
      hospitalAffiliation: doctor.hospitalAffiliation,
      availableDays: doctor.availableDays,
      availableTimeStart: doctor.availableTimeStart,
      availableTimeEnd: doctor.availableTimeEnd,
      consultationFee: doctor.consultationFee,
      isActive: doctor.user.isActive,
    };
  }

  @Delete('doctors/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateDoctor(@Param('id') id: string) {
    await this.doctorsService.deactivate(id);
    return { message: 'Doctor deactivated successfully' };
  }

  @Patch('doctors/:id/activate')
  async activateDoctor(@Param('id') id: string) {
    await this.doctorsService.activate(id);
    return { message: 'Doctor activated successfully' };
  }

  // ============ CAREGIVER MANAGEMENT ============

  @Post('caregivers')
  @HttpCode(HttpStatus.CREATED)
  async createCaregiver(@Body() createCaregiverDto: CreateCaregiverDto) {
    const tempPassword = this.buildTempPassword(createCaregiverDto.contactNumber!);

    const caregiver = await this.caregiversService.create({
      ...createCaregiverDto,
      password: tempPassword,
    });

    await this.usersService.setMustChangePassword(caregiver.user.id, true);

    await this.mailService.sendAccountCredentials(
      createCaregiverDto.email,
      createCaregiverDto.fullName,
      'Caregiver',
      createCaregiverDto.contactNumber!,
    );

    return {
      message: `Caregiver created. Login credentials have been sent to ${createCaregiverDto.email}`,
      caregiver: {
        id: caregiver.id,
        fullName: caregiver.user.fullName,
        email: caregiver.user.email,
        contactNumber: caregiver.user.contactNumber,
        specializations: caregiver.specializations,
        experienceYears: caregiver.experienceYears,
        isActive: caregiver.user.isActive,
      },
    };
  }

  @Get('caregivers')
  async getAllCaregivers() {
    const caregivers = await this.caregiversService.findAll();

    return {
      caregivers: caregivers.map((caregiver) => ({
        id: caregiver.id,
        fullName: caregiver.user.fullName,
        email: caregiver.user.email,
        contactNumber: caregiver.user.contactNumber,
        specializations: caregiver.specializations || [],
        availableShifts: caregiver.availableShifts || [],
        yearsOfExperience: caregiver.experienceYears || 0,
        isActive: caregiver.user.isActive,
        createdAt: caregiver.user.createdAt,
      })),
      total: caregivers.length,
    };
  }

  @Get('caregivers/:id')
  async getCaregiver(@Param('id') id: string) {
    const caregiver = await this.caregiversService.findOne(id);

    return {
      id: caregiver.id,
      fullName: caregiver.user.fullName,
      email: caregiver.user.email,
      contactNumber: caregiver.user.contactNumber,
      specializations: caregiver.specializations,
      availableShifts: caregiver.availableShifts,
      yearsOfExperience: caregiver.experienceYears,
      isActive: caregiver.user.isActive,
    };
  }

  @Delete('caregivers/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateCaregiver(@Param('id') id: string) {
    await this.caregiversService.deactivate(id);
    return { message: 'Caregiver deactivated successfully' };
  }

  @Patch('caregivers/:id/activate')
  async activateCaregiver(@Param('id') id: string) {
    await this.caregiversService.activate(id);
    return { message: 'Caregiver activated successfully' };
  }

  // ============ FAMILY MANAGEMENT ============
  @Get('families')
  async getAllFamilies() {
    return this.adminService.getAllFamilies();
  }

  @Get('families/:id')
  async getFamily(@Param('id') id: string) {
    return this.adminService.getFamilyById(id);
  }

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

  // ============ PATIENT MANAGEMENT ============
  @Get('patients')
  async getAllPatients() {
    return this.adminService.getAllPatients();
  }

  @Get('patients/:id')
  async getPatient(@Param('id') id: string) {
    return this.adminService.getPatientById(id);
  }

  @Delete('patients/:id')
  @HttpCode(HttpStatus.OK)
  async deletePatient(@Param('id') id: string) {
    await this.adminService.deletePatient(id);
    return { message: 'Patient deleted successfully' };
  }

  // ============ ADMIN PROFILE ============
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
