import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  carePlanId: string;
}
