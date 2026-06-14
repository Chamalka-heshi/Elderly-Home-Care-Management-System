import { IsString, IsNotEmpty } from 'class-validator';

// Validates the identity token received from third-party providers to ensure secure external authentication.
export class FirebaseAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
