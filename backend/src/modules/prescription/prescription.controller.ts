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
 * Doctor routes: require DOCTOR role (enforced globally by RolesGuard).
 * Family route:  GET /prescriptions/for-family — requires FAMILY role.
 *
 * IMPORTANT: the static route `for-family` must be declared BEFORE
 * the parameterised route `/:id`, otherwise Express will try to match
 * "for-family" as a UUID and throw a validation error.
 */
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionService) {}

  // ── Family member endpoint ───────────────────────────────────────────────────

  /**
   * GET /prescriptions/for-family
   * Returns all prescriptions for every patient that belongs to the
   * authenticated family member.  Includes doctor name via eager join.
   */
  @Get('for-family')
  @Roles(UserRole.FAMILY)
  findForFamily(@GetUser('sub') userId: string) {
    return this.service.findForFamily(userId);
  }

  /**
   * GET /prescriptions/for-family/:id
   * Family member views a single prescription by ID (must own the patient).
   */
  @Get('for-family/:id')
  @Roles(UserRole.FAMILY)
  findOneForFamily(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOneForFamily(id, userId);
  }

  // ── Doctor endpoints ─────────────────────────────────────────────────────────

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
