/* eslint-disable prettier/prettier */
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
import { AppointmentService } from './appointment.service';
import {
  UpdateAppointmentStatusDto,
  QueryAppointmentsDto,
} from './dto/appointment.dto';
import { Roles }    from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * AppointmentController — doctor & admin routes only.
 *
 * Family-member appointment routes live in FamilyController
 * under /family/appointments  (POST, GET, PATCH /:id/cancel).
 *
 * There is exactly ONE controller and ONE service for appointments.
 * The old AppointmentBookingController has been removed.
 */
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  // ── Doctor routes ───────────────────────────────────────────────────────────

  /** Get all CONFIRMED/COMPLETED appointments for this doctor's slots */
  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  getDoctorAppointments(@Req() req: any) {
    return this.service.getDoctorAppointments(req.user.sub);
  }

  /** Doctor updates an appointment status (confirm / complete / cancel) */
  @Patch('doctor/:id/status')
  @Roles(UserRole.DOCTOR)
  updateStatusByDoctor(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.updateAppointmentStatusByDoctor(req.user.sub, id, dto);
  }

  // ── Admin routes ────────────────────────────────────────────────────────────

  /** Get all appointments — sensitive patient medical data is HIDDEN from admin */
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllAppointments(@Query() query: QueryAppointmentsDto) {
    return this.service.getAllAppointments(query);
  }

  /** Admin updates appointment status */
  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminUpdateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.adminUpdateStatus(id, dto);
  }

  /** Admin deletes appointment */
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.adminDelete(id);
  }
}