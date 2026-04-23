/* eslint-disable prettier/prettier */
import { IsString, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateFamilyProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  /**
   * Transform empty string → undefined so @IsOptional() correctly skips
   * the @Matches validator when the field is cleared in the UI.
   * (class-validator treats "" as a value, not as absent.)
   */
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Contact number must be 10 digits' })
  contactNumber?: string;
}
