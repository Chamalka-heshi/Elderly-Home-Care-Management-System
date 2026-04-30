/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MedicationLogsService } from './medication-logs.service';
import {
  CreateMedicationLogDto,
  UpdateMedicationLogDto,
} from '../dto/medication-log.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@Controller('medication-logs')
export class MedicationLogsController {
  constructor(private readonly svc: MedicationLogsService) {}

  /** POST /medication-logs — caregiver logs a medication administration */
  @Post()
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMedicationLogDto, @Request() req: any) {
    return this.svc.create(dto, req.user.sub);
  }

  /** PATCH /medication-logs/:id — update status/notes of an existing log */
  @Patch(':id')
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationLogDto,
    @Request() req: any,
  ) {
    return this.svc.update(id, dto, req.user.sub);
  }

  /** GET /medication-logs — all logs (admin / doctor / caregiver) */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  findAll() {
    return this.svc.findAll();
  }

  /** GET /medication-logs/patient/:patientId */
  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.svc.findByPatient(patientId);
  }
}