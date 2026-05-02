import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post('create')
  @Roles(UserRole.FAMILY)
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.createBooking(req.user.sub, dto);
    return { message: 'Booking created successfully', booking };
  }

  @Get('my')
  @Roles(UserRole.FAMILY)
  async getMyBookings(@Req() req: any) {
    const bookings = await this.bookingsService.getMyBookings(req.user.sub);
    return { bookings, total: bookings.length };
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllBookings() {
    const bookings = await this.bookingsService.getAllBookings();
    return { bookings, total: bookings.length };
  }


}
