/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Patient }          from './entities/patient.entity';
import { FamilyMember }     from '../family/entities/family-member.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
  ) {}

  async create(
    familyMemberId: string,
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    // Verify family member exists
    const fm = await this.familyMemberRepository.findOne({ where: { id: familyMemberId } });
    if (!fm) throw new NotFoundException('Family member not found');

    const patient = this.patientsRepository.create({
      ...createPatientDto,
      familyMemberId,
    });

    try {
      return await this.patientsRepository.save(patient);
    } catch (err: any) {
      if (
        err instanceof QueryFailedError &&
        (err as any).code === '23505' // Postgres unique_violation
      ) {
        throw new ConflictException(
          'A patient with this NIC number already exists. Please check the NIC and try again.',
        );
      }
      throw err;
    }
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

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  /** Find a patient by id and verify it belongs to the given family member. */
  async findOneByFamily(id: string, familyMemberId: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id, familyMemberId },
    });
    if (!patient) throw new NotFoundException('Patient not found or does not belong to your account');
    return patient;
  }

  async update(
    id: string,
    familyMemberId: string,
    updateData: Partial<CreatePatientDto>,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    if (patient.familyMemberId !== familyMemberId) {
      throw new ForbiddenException('You can only update your own patients');
    }

    await this.patientsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string, familyMemberId: string): Promise<void> {
    const patient = await this.findOne(id);

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