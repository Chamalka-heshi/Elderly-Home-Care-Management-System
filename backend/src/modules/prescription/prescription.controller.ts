import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';

import { GetUser }               from '../../common/decorators/current-user.decorator';
import { Roles }                 from '../../common/decorators/roles.decorator';
import { UserRole }              from '../../common/enums/user-role.enum';
import { PrescriptionService }   from './prescription.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import type { PrescriptionStatus } from './entities/prescription.entity';


//Manages the issuance and lifecycle of medical prescriptions by clinical staff
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

//Permits authorized doctors to issue clinical instructions and medication orders for specific patients
  @Post()
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetUser('sub') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionService.create(userId, dto);
  }

//Retrieves a paginated list of prescriptions issued by the professional to support historical review
  @Get()
  @Roles(UserRole.DOCTOR)
  findAll(
    @GetUser('sub') userId: string,
    @Query('status')                          status?:    PrescriptionStatus,
    @Query('patientId')                       patientId?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page  = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.prescriptionService.findAll(userId, status, patientId, page, limit);
  }

//Returns clinical instructions for a specific patient to assist in treatment planning
  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR)
  getPatientPrescriptions(
    @GetUser('sub') userId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.prescriptionService.findForPatient(patientId, userId);
  }

//Returns granular details for a specific prescription record while verifying clinical ownership
  @Get(':id')
  @Roles(UserRole.DOCTOR)
  findOne(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.prescriptionService.findOne(id, userId);
  }

//Terminates an active medication course prematurely due to clinical findings or patient reaction
  @Patch(':id/discontinue')
  @Roles(UserRole.DOCTOR)
  discontinue(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.prescriptionService.discontinue(id, userId);
  }

//Marks a medication cycle as fully executed to update the patient's active treatment records
  @Patch(':id/complete')
  @Roles(UserRole.DOCTOR)
  complete(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.prescriptionService.complete(id, userId);
  }
}
