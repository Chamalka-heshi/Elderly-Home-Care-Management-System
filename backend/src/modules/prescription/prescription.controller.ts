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


// Manages the issuance and lifecycle of medical prescriptions by clinical staff, ensuring secure patient record associations.
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionService) {}

  // Doctor Management
  // Permits authorized doctors to issue new clinical instructions and medication orders for specific patients.
  @Post()
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('sub') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    const prescription = await this.service.create(userId, dto);
    return { message: 'Prescription created successfully', prescription };
  }

  // Retrieves a paginated list of all prescriptions issued by the authenticated doctor, with optional status and patient filtering.
  @Get()
  @Roles(UserRole.DOCTOR)
  findAll(
    @GetUser('sub') userId: string,
    @Query('status')                          status?:    PrescriptionStatus,
    @Query('patientId')                       patientId?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page  = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.service.findAll(userId, status, patientId, page, limit);
  }

  // Returns granular details for a specific prescription record, verifying that it belongs to the requesting professional.
  @Get(':id')
  @Roles(UserRole.DOCTOR)
  findOne(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(id, userId);
  }

  // Terminates an active medication course prematurely due to clinical findings or patient reaction.
  @Patch(':id/discontinue')
  @Roles(UserRole.DOCTOR)
  async discontinue(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const prescription = await this.service.discontinue(id, userId);
    return { message: 'Prescription discontinued successfully', prescription };
  }

  // Marks a medication cycle as fully executed, updating the patient's active treatment record.
  @Patch(':id/complete')
  @Roles(UserRole.DOCTOR)
  async complete(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const prescription = await this.service.complete(id, userId);
    return { message: 'Prescription marked as completed successfully', prescription };
  }
}
