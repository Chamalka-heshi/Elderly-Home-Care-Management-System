import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @Roles(UserRole.FAMILY)
  async createPayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const payment = await this.paymentsService.createPayment(req.user.sub, dto);
    return { message: 'Payment created successfully', payment };
  }

  @Get('my')
  @Roles(UserRole.FAMILY)
  async getMyPayments(@Req() req: any) {
    const payments = await this.paymentsService.getMyPayments(req.user.sub);
    return { payments, total: payments.length };
  }

  /**
   * GET /payments/doctor
   * Returns all payments made for this doctor's channeling slots.
   * Shows only the consultation-fee portion (not the care-home fee).
   */
  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  async getDoctorPayments(@Req() req: any) {
    const payments = await this.paymentsService.getDoctorPayments(req.user.sub);
    const totalIncome = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.consultationFee), 0);
    return { payments, total: payments.length, totalIncome };
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllPayments() {
    const payments = await this.paymentsService.getAllPayments();
    return { payments, total: payments.length };
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPendingPayments() {
    const payments = await this.paymentsService.getPendingPayments();
    return { payments, total: payments.length };
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  approvePayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.approvePayment(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  rejectPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.rejectPayment(id);
  }
}