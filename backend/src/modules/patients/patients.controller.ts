/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Roles }           from '../../common/decorators/roles.decorator';
import { UserRole }        from '../../common/enums/user-role.enum';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * GET /patients/assigned
   * MUST be declared BEFORE GET :id so NestJS does not treat "assigned" as a UUID.
   *
   * PHASE 1 (current): Returns ALL patients so caregivers can work with everyone.
   * PHASE 2 (after payments module is live): Replace findAll() below with
   *   findAllWithPaymentPlan() so only patients on an active plan are returned.
   */
  @Get('assigned')
  @Roles(UserRole.CAREGIVER)
  async findAssigned() {
    // TODO Phase 2: switch to this.patientsService.findAllWithPaymentPlan()
    const patients = await this.patientsService.findAll();
    return { patients, total: patients.length };
  }

  /** GET /patients/:id — single patient */
  @Get(':id')
  @Roles(UserRole.FAMILY, UserRole.DOCTOR, UserRole.CAREGIVER, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  /** GET /patients — all patients (admin / doctor / caregiver) */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  async findAll() {
    const patients = await this.patientsService.findAll();
    return { patients, total: patients.length };
  }

  /**
   * POST /patients/:id/plan
   * Family member selects a payment plan for one of their patients.
   */
  @Post(':id/plan')
  @Roles(UserRole.FAMILY)
  async selectPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('plan') plan: string,
    @Request() req: any,
  ) {
    return this.patientsService.setPaymentPlan(id, req.user.id, plan);
  }
}
