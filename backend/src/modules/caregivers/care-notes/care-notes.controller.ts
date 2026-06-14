// src/care-notes/care-notes.controller.ts
import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CareNotesService } from './care-notes.service';
import { UpdateCareNoteDto } from '../dto/update-care-note.dto';
import { CreateCareNoteDto } from '../dto/create-care-note.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@Controller('care-notes')
export class CareNotesController {
  constructor(private readonly careNotesService: CareNotesService) {}

  @Post()
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCareNoteDto, @Request() req: any) {
    return this.careNotesService.create(dto, req.user.sub);
  }

  // PATCH /care-notes/:id
  @Patch(':id')
  @Roles(UserRole.CAREGIVER)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareNoteDto,
    @Request() req: any,
  ) {
    return this.careNotesService.update(id, dto, req.user.sub);
  }
}
