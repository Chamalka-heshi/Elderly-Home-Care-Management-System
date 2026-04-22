/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicationLog } from '../entities/medication-log.entity';
import {
  CreateMedicationLogDto,
  UpdateMedicationLogDto,
} from '../dto/medication-log.dto';

@Injectable()
export class MedicationLogsService {
  constructor(
    @InjectRepository(MedicationLog)
    private readonly repo: Repository<MedicationLog>,
  ) {}

  async create(
    dto: CreateMedicationLogDto,
    caregiverId: string,
  ): Promise<MedicationLog> {
    const log = this.repo.create({ ...dto, caregiverId });
    return this.repo.save(log);
  }

  async update(
    id: string,
    dto: UpdateMedicationLogDto,
    caregiverId: string,
  ): Promise<MedicationLog> {
    const log = await this.repo.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Medication log "${id}" not found`);
    if (log.caregiverId !== caregiverId)
      throw new ForbiddenException('You cannot update this log');
    Object.assign(log, dto);
    return this.repo.save(log);
  }

  async findByPatient(patientId: string): Promise<MedicationLog[]> {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<MedicationLog[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
