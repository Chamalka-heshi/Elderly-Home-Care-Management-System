// src/care-notes/care-notes.controller.ts
import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CareNotesService } from './care-notes.service';
import { UpdateCareNoteDto } from '../dto/update-care-note.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateCareNoteDto } from '../dto/create-care-note.dto';

@Controller('care-notes')
@UseGuards(JwtAuthGuard)
export class CareNotesController {
  constructor(private readonly careNotesService: CareNotesService) {}

   @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCareNoteDto, @Request() req) {
    return this.careNotesService.create(dto, req.user.id);
  }

  // PATCH /care-notes/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareNoteDto,
    @Request() req,
  ) {
    return this.careNotesService.update(id, dto, req.user.id);
  }
}