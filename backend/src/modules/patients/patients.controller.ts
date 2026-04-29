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

//Surfaces patients for caregivers to enable routine check-ins and clinical monitoring
  @Get('assigned')
  @Roles(UserRole.CAREGIVER)
  async findAssigned() {
    const patients = await this.patientsService.findAll();
    return { patients, total: patients.length };
  }

//Provides a consolidated medical timeline to assist doctors in clinical decision-making
  @Get(':id/medical-history')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async getMedicalHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getMedicalHistory(id);
  }

//Enables family members to subscribe patients to specialized care plans for advanced clinical access
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