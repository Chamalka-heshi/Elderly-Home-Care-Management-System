// src/care-notes/dto/update-care-note.dto.ts
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateCareNoteDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  note?: string;

  @IsIn(['general', 'medical', 'behavioral'])
  @IsOptional()
  category?: string;
}