import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateCareNoteDto {
  @IsUUID()
  residentId: string;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsIn(['general', 'medical', 'behavioral'])
  @IsOptional()
  category?: string;
}
