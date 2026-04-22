/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalRecord } from '../entities/vital-record.entity';
import { CreateVitalRecordDto, UpdateVitalRecordDto } from '../dto/vital-record.dto';

@Injectable()
export class VitalRecordsService {
  constructor(
    @InjectRepository(VitalRecord)
    private readonly repo: Repository<VitalRecord>,
  ) {}

  async create(dto: CreateVitalRecordDto, caregiverId: string): Promise<VitalRecord> {
    const record = this.repo.create({ ...dto, caregiverId });
    return this.repo.save(record);
  }

  async update(
    id: string,
    dto: UpdateVitalRecordDto,
    caregiverId: string,
  ): Promise<VitalRecord> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Vital record "${id}" not found`);
    if (record.caregiverId !== caregiverId)
      throw new ForbiddenException('You cannot update this record');
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async findByPatient(patientId: string): Promise<VitalRecord[]> {
    return this.repo.find({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });
  }

  async findAll(): Promise<VitalRecord[]> {
    return this.repo.find({ order: { recordedAt: 'DESC' } });
  }
}
