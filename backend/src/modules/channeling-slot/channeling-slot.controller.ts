import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { ChannelingSlotService } from './channeling-slot.service';
import { Roles }                 from '../../common/decorators/roles.decorator';
import { UserRole }              from '../../common/enums/user-role.enum';
import { GetUser }               from '../../common/decorators/current-user.decorator';
import {
  CreateChannelingSlotDto,
  UpdateChannelingSlotDto,
  UpdateDoctorSlotFeeDto,
} from './dto/channeling-slot.dto';

@Controller('channeling-slots')
export class ChannelingSlotController {
  constructor(private readonly channelingSlotService: ChannelingSlotService) {}

  // Public Access

  // Provides a list of all currently active slots to facilitate the patient's doctor selection process.
  @Get('available')
  getAvailableSlots() {
    return this.channelingSlotService.getAvailableSlotsWithDoctors();
  }

  // Doctor Management

  // Retrieves all historical and upcoming slots assigned specifically to the logged-in doctor.
  @Get('my-slots')
  @Roles(UserRole.DOCTOR)
  findMySlots(@GetUser('sub') userId: string) {
    return this.channelingSlotService.findSlotsByUserId(userId);
  }

  // Permits doctors to acknowledge their availability for a proposed session, moving it to an active state.
  @Patch('my-slots/:id/accept')
  @Roles(UserRole.DOCTOR)
  acceptSlot(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.channelingSlotService.acceptSlot(id, userId);
  }

  // Allows doctors to decline a proposed slot if they have scheduling conflicts or personal reasons.
  @Patch('my-slots/:id/reject')
  @Roles(UserRole.DOCTOR)
  rejectSlot(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.channelingSlotService.rejectSlot(id, userId);
  }

  // Enables doctors to adjust their individual session fees for specific time slots based on demand or specialization.
  @Patch('my-slots/:id/fee')
  @Roles(UserRole.DOCTOR)
  updateMySlotFee(
    @GetUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorSlotFeeDto,
  ) {
    return this.channelingSlotService.updateDoctorSlotFee(id, userId, dto);
  }

  // Administrative Control

  // Creates a new proposed time slot for a doctor, which remains pending until the doctor accepts it.
  @Post('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateChannelingSlotDto) {
    return this.channelingSlotService.create(dto);
  }

  // Returns all system slots for operational oversight.
  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll() {
    return this.channelingSlotService.findAll();
  }

  // Retrieves granular details for a single slot, including its current status and assigned participants.
  @Get('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelingSlotService.findOne(id);
  }

  // Updates an existing slot's details such as time or limits.
  @Patch('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChannelingSlotDto,
  ) {
    return this.channelingSlotService.update(id, dto);
  }

  // Marks a slot as cancelled to prevent further patient bookings while preserving the historical record.
  @Patch('admin/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelingSlotService.cancel(id);
  }

  // Permanently removes a slot from the system; typically reserved for cleaning up administrative errors.
  @Delete('admin/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelingSlotService.remove(id);
  }
}