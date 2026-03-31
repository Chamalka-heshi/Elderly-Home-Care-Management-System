import { IsString, IsNotEmpty } from 'class-validator';

export class FirebaseAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
