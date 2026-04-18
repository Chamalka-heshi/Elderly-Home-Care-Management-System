import {
  Controller,
  Get,
  Post,
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
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  QueryAppointmentsDto,
} from './dto/appointment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

// JWT + RolesGuard enforced globally via APP_GUARD in AppModule.
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  // ── Family member routes ────────────────────────────────────────────────────

  /** Book an appointment for one of the family's patients */
  @Post()
  @Roles(UserRole.FAMILY)
  create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.service.createAppointment(req.user.sub, dto);
  }

  /** List all appointments made by this family member */
  @Get('my-appointments')
  @Roles(UserRole.FAMILY)
  getMyAppointments(@Req() req: any) {
    return this.service.getMyAppointments(req.user.sub);
  }

  /** Cancel one of this family member's appointments */
  @Patch('my-appointments/:id/cancel')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.OK)
  cancelMyAppointment(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancelMyAppointment(req.user.sub, id);
  }

  // ── Doctor routes ───────────────────────────────────────────────────────────

  /** Get all appointments for this doctor's slots — FULL patient medical details */
  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  getDoctorAppointments(@Req() req: any) {
    return this.service.getDoctorAppointments(req.user.sub);
  }

  /** Doctor confirms / completes / cancels an appointment */
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
  @Roles(UserRole.ADMIN)
  getAllAppointments(@Query() query: QueryAppointmentsDto) {
    return this.service.getAllAppointments(query);
  }

  /** Admin updates appointment status */
  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  adminUpdateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.adminUpdateStatus(id, dto);
  }

  /** Admin deletes appointment */
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  adminDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.adminDelete(id);
  }
}