import {
  IsOptional,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOnePaymentTarget', async: false })
class AtLeastOnePaymentTarget implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as InitiatePayHerePaymentDto;
    return !!(obj.bookingId || obj.appointmentId);
  }

  defaultMessage(): string {
    return 'Provide at least one of bookingId or appointmentId';
  }
}

export class InitiatePayHerePaymentDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @Validate(AtLeastOnePaymentTarget)
  private readonly _atLeastOneTarget?: boolean;
}
