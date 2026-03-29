import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class ReplyContactMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  reply: string;
}