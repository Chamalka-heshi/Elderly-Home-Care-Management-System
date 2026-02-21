/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { FamilyService } from '../family/family.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    private familyService: FamilyService,
  ) {}

  async create(
    familyMemberId: string,
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    // Verify family member exists
    await this.familyService.findById(familyMemberId);

    const patient = this.patientsRepository.create({
      ...createPatientDto,
      familyMemberId,
    });

    return this.patientsRepository.save(patient);
  }

  async findAllByFamily(familyMemberId: string): Promise<Patient[]> {
    return this.patientsRepository.find({
      where: { familyMemberId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['familyMember'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(
    id: string,
    familyMemberId: string,
    updateData: Partial<CreatePatientDto>,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    // Verify ownership
    if (patient.familyMemberId !== familyMemberId) {
      throw new ForbiddenException('You can only update your own patients');
    }

    await this.patientsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string, familyMemberId: string): Promise<void> {
    const patient = await this.findOne(id);

    // Verify ownership
    if (patient.familyMemberId !== familyMemberId) {
      throw new ForbiddenException('You can only delete your own patients');
    }

    await this.patientsRepository.delete(id);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientsRepository.find({
      relations: ['familyMember'],
      order: { createdAt: 'DESC' },
    });
  }
}