// src/care-notes/care-notes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareNote } from '../entities/care-note.entity';
import { CareNotesService } from './care-notes.service';
import { CareNotesController } from './care-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CareNote])],
  controllers: [CareNotesController],
  providers: [CareNotesService],
})
export class CareNotesModule {}