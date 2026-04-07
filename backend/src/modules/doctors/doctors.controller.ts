/* eslint-disable prettier/prettier */
import { Controller, Get, Param, UseGuards, Request, Patch, Body } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { id: string } }) {
    return this.doctorsService.findByUserId(req.user.id);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  setAvailability(
    @Request() req: any,
    @Body() body: { availableDays: string[]; availableTimeStart: string; availableTimeEnd: string },
  ) {
    return this.doctorsService.setAvailability(req.user.id, body.availableDays, body.availableTimeStart, body.availableTimeEnd);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}