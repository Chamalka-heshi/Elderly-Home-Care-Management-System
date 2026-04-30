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
import { VitalRecordsService } from './vital-records.service';
import { CreateVitalRecordDto, UpdateVitalRecordDto } from '../dto/vital-record.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@Controller('vital-records')
export class VitalRecordsController {
  constructor(private readonly svc: VitalRecordsService) {}

  /** POST /vital-records — caregiver records vitals for a patient */
  @Post()
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVitalRecordDto, @Request() req: any) {
    return this.svc.create(dto, req.user.sub);
  }

  /** PATCH /vital-records/:id — caregiver updates their own record */
  @Patch(':id')
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVitalRecordDto,
    @Request() req: any,
  ) {
    return this.svc.update(id, dto, req.user.sub);
  }

  /** GET /vital-records — all records (admin / doctor / caregiver) */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  findAll() {
    return this.svc.findAll();
  }

  /** GET /vital-records/patient/:patientId — records for a specific patient */
  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.svc.findByPatient(patientId);
  }
}