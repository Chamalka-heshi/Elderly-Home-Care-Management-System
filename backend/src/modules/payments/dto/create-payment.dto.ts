import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
