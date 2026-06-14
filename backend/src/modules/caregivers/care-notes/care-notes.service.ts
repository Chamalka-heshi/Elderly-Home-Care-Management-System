// src/care-notes/care-notes.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareNote } from '../entities/care-note.entity';
import { UpdateCareNoteDto } from '../dto/update-care-note.dto';
import { CreateCareNoteDto } from '../dto/create-care-note.dto';

@Injectable()
export class CareNotesService {
  constructor(
    @InjectRepository(CareNote)
    private readonly careNoteRepo: Repository<CareNote>,
  ) {}

  async create(dto: CreateCareNoteDto, caregiverId: string): Promise<CareNote> {
    const note = this.careNoteRepo.create({
      residentId: dto.residentId,
      caregiverId: caregiverId,
      note: dto.note,
      category: dto.category ?? 'general',
    });

    return this.careNoteRepo.save(note);
  }

  async update(
    id: string,
    dto: UpdateCareNoteDto,
    caregiverId: string,
  ): Promise<CareNote> {
    // 1. Find the note by ID
    const note = await this.careNoteRepo.findOne({ where: { id } });

    // 2. Throw 404 if not found
    if (!note) {
      throw new NotFoundException(`Care note with ID "${id}" not found`);
    }

    // 3. Ensure only the caregiver who created it can update it
    if (note.caregiverId !== caregiverId) {
      throw new ForbiddenException(
        'You are not allowed to update this care note',
      );
    }

    // 4. Apply only the fields that were provided
    if (dto.note !== undefined) note.note = dto.note;
    if (dto.category !== undefined) note.category = dto.category;

    // 5. Save and return the updated note
    return this.careNoteRepo.save(note);
  }
}
