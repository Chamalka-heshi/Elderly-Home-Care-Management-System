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
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard }         from '../../common/guards/jwt-auth.guard';
import { CurrentUser }          from '../../common/decorators/current-user.decorator'; // ✅ matches actual export
import { Roles }                from '../../common/decorators/roles.decorator';
import { RolesGuard }           from '../../common/guards/roles.guard';
import { UserRole }             from '../../common/enums/user-role.enum';             // ✅ required by Roles()
import { PrescriptionService }  from './prescription.service';                        // ✅ singular — matches service file
import { CreatePrescriptionDto } from './dto/prescription.dto';
import type { PrescriptionStatus } from './entities/prescription.entity';

/**
 * All routes require a valid doctor JWT.
 * doctorId is extracted from the JWT — never from the request body.
 *
 * POST   /api/prescriptions               — create
 * GET    /api/prescriptions               — list (doctor-scoped, paginated)
 * GET    /api/prescriptions/:id           — single
 * PATCH  /api/prescriptions/:id/discontinue
 * PATCH  /api/prescriptions/:id/complete
 * DELETE /api/prescriptions/:id
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)                    // ✅ enum value — not a plain string
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionService) {} // ✅ singular

  // ── POST /prescriptions ─────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') doctorId: string,   // ✅ CurrentUser — matches decorator export
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.service.create(doctorId, dto);
  }

  // ── GET /prescriptions ──────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser('id') doctorId: string,
    @Query('status')                          status?:    PrescriptionStatus,
    @Query('patientId')                       patientId?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page  = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.service.findAll(doctorId, status, patientId, page, limit);
  }

  // ── GET /prescriptions/:id ──────────────────────────────────────────────────

  @Get(':id')
  findOne(
    @CurrentUser('id') doctorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(id, doctorId);
  }

  // ── PATCH /prescriptions/:id/discontinue ────────────────────────────────────

  @Patch(':id/discontinue')
  discontinue(
    @CurrentUser('id') doctorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.discontinue(id, doctorId);
  }

  // ── PATCH /prescriptions/:id/complete ───────────────────────────────────────

  @Patch(':id/complete')
  complete(
    @CurrentUser('id') doctorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.complete(id, doctorId);
  }

  // ── DELETE /prescriptions/:id ────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('id') doctorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(id, doctorId);
  }
}
