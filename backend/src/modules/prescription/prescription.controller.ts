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
import { GetUser }          from '../../common/decorators/current-user.decorator';
import { Roles }                from '../../common/decorators/roles.decorator';
import { UserRole }             from '../../common/enums/user-role.enum';
import { PrescriptionService }  from './prescription.service';
import { CreatePrescriptionDto } from './dto/prescription.dto';
import type { PrescriptionStatus } from './entities/prescription.entity';

/**
 * All routes require a valid doctor JWT (enforced globally by APP_GUARD).
 * RolesGuard is also global — no need for @UseGuards(RolesGuard) here.
 * doctorId is extracted from the JWT — never from the request body.
 */
@Roles(UserRole.DOCTOR)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetUser('sub') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
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
  findOne(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id/discontinue')
  discontinue(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.discontinue(id, userId);
  }

  @Patch(':id/complete')
  complete(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.complete(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(id, userId);
  }
}