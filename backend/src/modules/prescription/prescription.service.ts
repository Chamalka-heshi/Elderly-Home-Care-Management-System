// prescription.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription, type PrescriptionStatus } from './entities/prescription.entity';
import { Doctor } from '../doctors/entities/doctor.entity';  // ← add this
import { CreatePrescriptionDto } from './dto/prescription.dto';

export interface PrescriptionListResult {
  data:  Prescription[];
  total: number;
  page:  number;
  limit: number;
}

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly repo: Repository<Prescription>,

    @InjectRepository(Doctor)               // ← add this
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  // ── helper: resolve doctors.id from users.id ────────────────────────────────

  private async resolveDoctorId(userId: string): Promise<string> {
  const doctor = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
  if (!doctor) throw new ForbiddenException('No doctor profile found for this user.');
  return doctor.id;
}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);  // ← resolve here

    const prescription = this.repo.create({
      doctorId,
      patientId:   dto.patientId?.trim()  ?? null,
      patientName: dto.patientName.trim(),
      patientAge:  dto.patientAge,
      diagnosis:   dto.diagnosis?.trim()  ?? null,
      notes:       dto.notes?.trim()      ?? null,
      issuedDate:  dto.issuedDate,
      validUntil:  dto.validUntil?.trim() ?? null,
      medicines:   dto.medicines,
      status:      'active',
    });
    return this.repo.save(prescription);
  }

  // ── List ────────────────────────────────────────────────────────────────────

  async findAll(
    userId:     string,
    status?:    PrescriptionStatus,
    patientId?: string,
    page        = 1,
    limit       = 50,
  ): Promise<PrescriptionListResult> {
    const doctorId = await this.resolveDoctorId(userId);  // ← resolve here

    const qb = this.repo
      .createQueryBuilder('rx')
      .where('rx.doctorId = :doctorId', { doctorId })
      .orderBy('rx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status)    qb.andWhere('rx.status = :status',       { status });
    if (patientId) qb.andWhere('rx.patientId = :patientId', { patientId });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ── Get one ─────────────────────────────────────────────────────────────────

  async findOne(id: string, userId: string): Promise<Prescription> {
    const doctorId = await this.resolveDoctorId(userId);  // ← resolve here
    const rx = await this.repo.findOne({ where: { id, doctorId } });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found.`);
    return rx;
  }

  // ── Discontinue ──────────────────────────────────────────────────────────────

  async discontinue(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'discontinued')
      throw new BadRequestException('Prescription is already discontinued.');
    rx.status = 'discontinued';
    return this.repo.save(rx);
  }

  // ── Complete ─────────────────────────────────────────────────────────────────

  async complete(id: string, userId: string): Promise<Prescription> {
    const rx = await this.findOne(id, userId);
    if (rx.status === 'completed')
      throw new BadRequestException('Prescription is already completed.');
    rx.status = 'completed';
    return this.repo.save(rx);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<void> {
    const rx = await this.findOne(id, userId);
    await this.repo.remove(rx);
  }
}