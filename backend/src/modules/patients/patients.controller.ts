/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FamilyService } from '../family/family.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly familyService: FamilyService,
  ) {}

  @Post()
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    // Get family member ID from user
    const familyMember = await this.familyService.findByUserId(user.id);

    const patient = await this.patientsService.create(
      familyMember.id,
      createPatientDto,
    );

    return {
      message: 'Patient registered successfully',
      patient,
    };
  }

  @Get('my-patients')
  @Roles(UserRole.FAMILY)
  async findMyPatients(@CurrentUser() user: any) {
    const familyMember = await this.familyService.findByUserId(user.id);
    const patients = await this.patientsService.findAllByFamily(familyMember.id);

    return {
      patients,
      total: patients.length,
    };
  }

  @Get(':id')
  @Roles(UserRole.FAMILY, UserRole.DOCTOR, UserRole.CAREGIVER, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.FAMILY)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePatientDto: Partial<CreatePatientDto>,
  ) {
    const familyMember = await this.familyService.findByUserId(user.id);

    const patient = await this.patientsService.update(
      id,
      familyMember.id,
      updatePatientDto,
    );

    return {
      message: 'Patient updated successfully',
      patient,
    };
  }

  @Delete(':id')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const familyMember = await this.familyService.findByUserId(user.id);
    await this.patientsService.delete(id, familyMember.id);

    return {
      message: 'Patient deleted successfully',
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  async findAll() {
    const patients = await this.patientsService.findAll();

    return {
      patients,
      total: patients.length,
    };
  }
}