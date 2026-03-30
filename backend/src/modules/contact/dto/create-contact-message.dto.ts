/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// ── Public: submit a contact message ─────────────────────────────────────────

export class CreateContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;
}

// ── Admin: reply to a contact message ────────────────────────────────────────

export class ReplyContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  reply: string;
}

// ── Admin: update system contact info (email, phone, address …) ──────────────

export class UpdateContactInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phonePrimary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneEmergency?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  openHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mapUrl?: string;
}
