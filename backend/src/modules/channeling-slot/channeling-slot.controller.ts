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

import { ChannelingSlotService } from './channeling-slot.service';
import { Roles }                 from '../../common/decorators/roles.decorator';
import { UserRole }              from '../../common/enums/user-role.enum';
import { 
  CreateChannelingSlotDto, 
  UpdateChannelingSlotDto, 
  UpdateDoctorSlotFeeDto, 
  QueryChannelingSlotsDto 
} from './dto/channeling-slot.dto';

@Controller('channeling-slots')
export class ChannelingSlotController {
  constructor(private readonly service: ChannelingSlotService) {}

  // Public Access

  // Provides a list of all currently active slots to facilitate the patient's doctor selection process.
  @Get('available')
  getAvailableSlots() {
    return this.service.getAvailableSlotsWithDoctors();
  }

  // Doctor Management

  // Retrieves all historical and upcoming slots assigned specifically to the logged-in doctor.
  @Get('my-slots')
  @Roles(UserRole.DOCTOR)
  findMySlots(@Req() req: any) {
    return this.service.findSlotsByUserId(req.user.sub);
  }

  // Permits doctors to acknowledge their availability for a proposed session, moving it to an active state.
  @Patch('my-slots/:id/accept')
  @Roles(UserRole.DOCTOR)
  acceptSlot(
    @Req() req: any, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.acceptSlot(id, req.user.sub);
  }

  // Allows doctors to decline a proposed slot if they have scheduling conflicts or personal reasons.
  @Patch('my-slots/:id/reject')
  @Roles(UserRole.DOCTOR)
  rejectSlot(
    @Req() req: any, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.rejectSlot(id, req.user.sub);
  }

  // Enables doctors to adjust their individual session fees for specific time slots based on demand or specialization.
  @Patch('my-slots/:id/fee')
  @Roles(UserRole.DOCTOR)
  updateMySlotFee(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorSlotFeeDto,
  ) {
    return this.service.updateDoctorSlotFee(id, req.user.sub, dto);
  }

  // Administrative Control

  // Creates a new proposed time slot for a doctor, which remains pending until the doctor accepts it.
  @Post('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateChannelingSlotDto) {
    return this.service.create(dto);
  }

  // Returns all system slots with advanced filtering capabilities for operational oversight.
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryChannelingSlotsDto) {
    return this.service.findAll(query);
  }

  // Aggregates a specific doctor's weekly availability to assist administrators in workload balancing.
  @Get('admin/doctor/:doctorId/weekly')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  weeklySchedule(@Param('doctorId', ParseUUIDPipe) doctorId: string) {
    return this.service.getWeeklySchedule(doctorId);
  }

  // Retrieves granular details for a single slot, including its current status and assigned participants.
  @Get('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // Marks a slot as cancelled to prevent further patient bookings while preserving the historical record.
  @Patch('admin/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(id);
  }

  // Permanently removes a slot from the system; typically reserved for cleaning up administrative errors.
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}