import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { AppointmentService }        from './appointment.service';
import { Roles }                     from '../../common/decorators/roles.decorator';
import { UserRole }                  from '../../common/enums/user-role.enum';
import { 
  UpdateAppointmentStatusDto, 
  QueryAppointmentsDto 
} from './dto/appointment.dto';


// Orchestrates appointment workflows for doctors and administrators, separating medical oversight from system management.
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  // Doctor Management

  // Retrieves all confirmed and completed appointments assigned to the logged-in doctor.
  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  getDoctorAppointments(@Req() req: any) {
    return this.service.getDoctorAppointments(req.user.sub);
  }

  // Allows doctors to update appointment stages, ensuring the medical consultation flow is accurately tracked.
  @Patch('doctor/:id/status')
  @Roles(UserRole.DOCTOR)
  updateStatusByDoctor(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.updateAppointmentStatusByDoctor(req.user.sub, id, dto);
  }

  // Administrative Oversight

  // Provides a system-wide view of all appointments for resource planning, while redacting sensitive medical details.
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllAppointments(@Query() query: QueryAppointmentsDto) {
    return this.service.getAllAppointments(query);
  }

  // Permits administrators to override appointment statuses to resolve scheduling conflicts or billing issues.
  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminUpdateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.adminUpdateStatus(id, dto);
  }

  // Facilitates the removal of erroneous or cancelled appointment records from the system.
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.adminDelete(id);
  }
}