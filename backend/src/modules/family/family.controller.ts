/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Roles }              from '../../common/decorators/roles.decorator';
import { GetUser }            from '../../common/decorators/current-user.decorator';
import { UserRole }           from '../../common/enums/user-role.enum';
import { FamilyService }      from './family.service';
import { UsersService }       from '../users/users.service';
import { PatientsService }    from '../patients/patients.service';
import { AppointmentService } from '../appointments/appointment.service';
import { PrescriptionService } from '../prescription/prescription.service';
import { CreatePatientDto }   from '../patients/dto/create-patient.dto';
import { UpdateFamilyProfileDto } from './dto/update-family-profile.dto';
import { CreateAppointmentDto } from '../appointments/dto/appointment.dto';

/**
 * FamilyController — all family-member operations live here.
 *
 * Base route: /family
 *
 * Patients      =>  /family/patients
 * Appointments  =>  /family/appointments
 * Prescriptions =>  /family/prescriptions
 */
@Controller('family')
export class FamilyController {
  constructor(
    private readonly familyService: FamilyService,
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly appointmentService: AppointmentService,
    private readonly prescriptionService: PrescriptionService,
  ) {}

  /**
   * Finds the FamilyMember row for the current user and, if it is missing
   * (e.g. due to a prior sign-up error), creates it automatically so that
   * the request can continue rather than returning a misleading 404.
   */
  private async resolveFamilyMember(userId: string) {
    let familyMember = await this.familyService.findByUserId(userId);
    if (!familyMember) {
      const user = await this.usersService.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      familyMember = await this.familyService.create({ user });
    }
    return familyMember;
  }

  // =====================================================================
  //  PROFILE route   /family/profile
  // =====================================================================

  /**
   * PATCH /family/profile
   * Lets the logged-in family member update their own fullName and contactNumber.
   */
  @Patch('profile')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @GetUser() user: any,
    @Body() dto: UpdateFamilyProfileDto,
  ) {
    const updated = await this.familyService.updateProfileByUserId(user.sub, dto);
    return {
      message:       'Profile updated successfully',
      id:            updated.user.id,
      fullName:      updated.user.fullName,
      email:         updated.user.email,
      role:          updated.user.role,
      contactNumber: updated.user.contactNumber,
    };
  }

  // =====================================================================
  //  PATIENT routes   /family/patients
  // =====================================================================

  /** Register a new patient (elderly person) under the family account */
  @Post('patients')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @GetUser() user: any,
    @Body() dto: CreatePatientDto,
  ) {
    const familyMember = await this.resolveFamilyMember(user.sub);
    const patient = await this.patientsService.create(familyMember.id, dto);
    return { message: 'Patient registered successfully', patient };
  }

  /** Get all patients belonging to the authenticated family member */
  @Get('patients')
  @Roles(UserRole.FAMILY)
  async getMyPatients(@GetUser() user: any) {
    const familyMember = await this.resolveFamilyMember(user.sub);
    const patients = await this.patientsService.findAllByFamily(familyMember.id);
    return { patients, total: patients.length };
  }

  /** Get a single patient by id (family member must own the patient) */
  @Get('patients/:id')
  @Roles(UserRole.FAMILY)
  async getPatient(
    @GetUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const familyMember = await this.resolveFamilyMember(user.sub);
    return this.patientsService.findOneByFamily(id, familyMember.id);
  }

  /** Update a patient's details */
  @Patch('patients/:id')
  @Roles(UserRole.FAMILY)
  async updatePatient(
    @GetUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreatePatientDto>,
  ) {
    const familyMember = await this.resolveFamilyMember(user.sub);
    const patient = await this.patientsService.update(id, familyMember.id, dto);
    return { message: 'Patient updated successfully', patient };
  }

  /** Delete / remove a patient */
  @Delete('patients/:id')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.OK)
  async deletePatient(
    @GetUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const familyMember = await this.resolveFamilyMember(user.sub);
    await this.patientsService.delete(id, familyMember.id);
    return { message: 'Patient deleted successfully' };
  }

  // =====================================================================
  //  APPOINTMENT routes   /family/appointments
  // =====================================================================

  /** Book an appointment for one of the family's patients */
  @Post('appointments')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  createAppointment(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(req.user.sub, dto);
  }

  /** List all appointments made by this family member */
  @Get('appointments')
  @Roles(UserRole.FAMILY)
  getMyAppointments(@Req() req: any) {
    return this.appointmentService.getMyAppointments(req.user.sub);
  }

  /** Cancel one of this family member's appointments */
  @Patch('appointments/:id/cancel')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.OK)
  cancelAppointment(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentService.cancelMyAppointment(req.user.sub, id);
  }

  // =====================================================================
  //  PRESCRIPTION routes   /family/prescriptions
  // =====================================================================

  /** Get all prescriptions for every patient belonging to this family member */
  @Get('prescriptions')
  @Roles(UserRole.FAMILY)
  getFamilyPrescriptions(@GetUser('sub') userId: string) {
    return this.prescriptionService.findForFamily(userId);
  }

  /** Get a single prescription (must belong to a family-owned patient) */
  @Get('prescriptions/:id')
  @Roles(UserRole.FAMILY)
  getFamilyPrescription(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.prescriptionService.findOneForFamily(id, userId);
  }
}