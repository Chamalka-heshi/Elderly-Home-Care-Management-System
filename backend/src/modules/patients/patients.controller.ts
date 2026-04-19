/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Roles }           from '../../common/decorators/roles.decorator';
import { UserRole }        from '../../common/enums/user-role.enum';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /** Get a single patient by id */
  @Get(':id')
  @Roles(UserRole.FAMILY, UserRole.DOCTOR, UserRole.CAREGIVER, UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  /** List all patients — for admin / doctor / caregiver views */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.CAREGIVER)
  async findAll() {
    const patients = await this.patientsService.findAll();
    return { patients, total: patients.length };
  }
}
