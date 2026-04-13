import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  ParseUUIDPipe, HttpCode, HttpStatus, Req
} from '@nestjs/common';
import { ChannelingSlotService } from './channeling-slot.service';
import { CreateChannelingSlotDto, UpdateChannelingSlotDto, QueryChannelingSlotsDto } from './dto/channeling-slot.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('channeling-slots')
export class ChannelingSlotController {
  constructor(private readonly service: ChannelingSlotService) {}

  // ── Authenticated (any logged-in user) ────────────────────────────────────

  @Get('available')
  getAvailableSlots() { return this.service.getAvailableSlotsWithDoctors(); }

  // ── Doctor routes ─────────────────────────────────────────────────────────

  @Get('my-slots')
  @Roles(UserRole.DOCTOR)
  findMySlots(@Req() req: any) { return this.service.findSlotsByUserId(req.user.sub); }

  @Patch('my-slots/:id/accept')
  @Roles(UserRole.DOCTOR)
  acceptSlot(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.acceptSlot(id, req.user.sub);
  }

  @Patch('my-slots/:id/reject')
  @Roles(UserRole.DOCTOR)
  rejectSlot(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.rejectSlot(id, req.user.sub);
  }

  // ── Admin routes ──────────────────────────────────────────────────────────

  @Post('admin')
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateChannelingSlotDto) { return this.service.create(dto); }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: QueryChannelingSlotsDto) { return this.service.findAll(query); }

  @Get('admin/doctor/:doctorId/weekly')
  @Roles(UserRole.ADMIN)
  weeklySchedule(@Param('doctorId', ParseUUIDPipe) doctorId: string) { return this.service.getWeeklySchedule(doctorId); }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChannelingSlotDto) { return this.service.update(id, dto); }

  @Patch('admin/:id/cancel')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) { return this.service.cancel(id); }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}
