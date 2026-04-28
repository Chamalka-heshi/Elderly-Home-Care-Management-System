import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Create Contact Message DTO

// Validates the inquiry payload from public visitors, ensuring mandatory identity and contact details are provided for follow-up.
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

// Reply Contact Message DTO

// Ensures administrative responses are structured correctly and adhere to length constraints for system consistency.
export class ReplyContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  reply: string;
}

// Update Contact Info DTO

// Permits administrators to update the facility's master contact details, enforcing format and safety constraints on every field.
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
