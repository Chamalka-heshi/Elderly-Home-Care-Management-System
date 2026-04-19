/* eslint-disable prettier/prettier */
// modules/prescription/prescription.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

/**
 * PrescriptionsController — doctor routes only.
 *
 * Family-member prescription routes have moved to FamilyController
 * under /family/prescriptions.
 */
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionService) {}

  // ── Doctor endpoints ──────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetUser('sub') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.service.create(userId, dto);
  }

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

  @Get(':id')
  @Roles(UserRole.DOCTOR)
  findOne(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id/discontinue')
  @Roles(UserRole.DOCTOR)
  discontinue(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.discontinue(id, userId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.DOCTOR)
  complete(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.complete(id, userId);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(id, userId);
  }
}
