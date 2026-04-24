import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateAppointmentBookingDto } from './dto/create-appointment-booking.dto';
import { AppointmentBookingService } from './appointment-booking.service';

@Controller('appointments')
export class AppointmentBookingController {
  constructor(private readonly appointmentBookingService: AppointmentBookingService) {}

  @Post('create')
  @Roles(UserRole.FAMILY)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreateAppointmentBookingDto) {
    return this.appointmentBookingService.create(req.user.sub, dto);
  }

  @Get('my')
  @Roles(UserRole.FAMILY)
  getMy(@Req() req: any) {
    return this.appointmentBookingService.getMy(req.user.sub);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAll() {
    return this.appointmentBookingService.getAll();
  }
}

