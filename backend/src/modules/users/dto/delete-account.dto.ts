/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty } from 'class-validator';

export class DeleteAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}