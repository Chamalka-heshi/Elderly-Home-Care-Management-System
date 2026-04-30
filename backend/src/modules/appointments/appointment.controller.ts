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
import { GetUser }                   from '../../common/decorators/current-user.decorator';
import { 
  UpdateAppointmentStatusDto, 
  QueryAppointmentsDto 
} from './dto/appointment.dto';


// Orchestrates appointment workflows for doctors and administrators, separating medical oversight from system management.
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // Doctor Management

  // Retrieves all confirmed and completed appointments assigned to the logged-in doctor.
  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  getDoctorAppointments(@GetUser('sub') userId: string) {
    return this.appointmentService.getDoctorAppointments(userId);
  }

  // Allows doctors to update appointment stages, ensuring the medical consultation flow is accurately tracked.
  @Patch('doctor/:id/status')
  @Roles(UserRole.DOCTOR)
  updateStatusByDoctor(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateAppointmentStatusByDoctor(userId, id, dto);
  }

  // Administrative Oversight

  // Provides a system-wide view of all appointments for resource planning, while redacting sensitive medical details.
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllAppointments(@Query() query: QueryAppointmentsDto) {
    return this.appointmentService.getAllAppointments(query);
  }

  // Permits administrators to override appointment statuses to resolve scheduling conflicts or billing issues.
  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminUpdateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.adminUpdateStatus(id, dto);
  }

  // Facilitates the removal of erroneous or cancelled appointment records from the system.
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.adminDelete(id);
  }
}