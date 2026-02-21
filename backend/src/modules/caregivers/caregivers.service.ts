/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caregiver } from './entities/caregiver.entity';
import { CreateCaregiverDto } from './dto/create-caregiver.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class CaregiversService {
  constructor(
    @InjectRepository(Caregiver)
    private caregiverRepository: Repository<Caregiver>,
    private usersService: UsersService,
  ) {}

  async create(createCaregiverDto: CreateCaregiverDto): Promise<Caregiver> {
    const { email, password, certifications, ...caregiverData } = createCaregiverDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.create(email, password, UserRole.CAREGIVER);

    const caregiver = this.caregiverRepository.create({
      user,
      fullName: caregiverData.fullName,
      nic: caregiverData.nic || '000000000V',
      contactNumber: caregiverData.contactNumber,
      address: caregiverData.address,
      qualification: caregiverData.qualification,
      experienceYears: caregiverData.yearsOfExperience || 0,
      specializations: certifications || [],
      emergencyContact: caregiverData.emergencyContact,
      availableShifts: caregiverData.availableShifts || ['flexible'],
    });

    return this.caregiverRepository.save(caregiver);
  }

  async findAll(): Promise<Caregiver[]> {
    return this.caregiverRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<Caregiver[]> {
    return this.caregiverRepository.find({
      where: { user: { isActive: true } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Caregiver> {
    const caregiver = await this.caregiverRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    return caregiver;
  }

  async findByUserId(userId: string): Promise<Caregiver | null> {
    return this.caregiverRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, updateData: Partial<CreateCaregiverDto>): Promise<Caregiver> {
    const caregiver = await this.findOne(id);

    if (updateData.fullName) caregiver.fullName = updateData.fullName;
    if (updateData.contactNumber) caregiver.contactNumber = updateData.contactNumber;
    if (updateData.qualification) caregiver.qualification = updateData.qualification;
    if (updateData.yearsOfExperience !== undefined) caregiver.experienceYears = updateData.yearsOfExperience;
    if (updateData.certifications) caregiver.specializations = updateData.certifications;
    if (updateData.address) caregiver.address = updateData.address;
    if (updateData.availableShifts) caregiver.availableShifts = updateData.availableShifts;

    return this.caregiverRepository.save(caregiver);
  }

  /**
   * Deactivate is handled entirely via User.isActive — single source of truth.
   */
  async deactivate(id: string): Promise<void> {
    const caregiver = await this.findOne(id);
    await this.usersService.deactivateUser(caregiver.user.id);
  }

  async activate(id: string): Promise<void> {
    const caregiver = await this.findOne(id);
    await this.usersService.activateUser(caregiver.user.id);
  }
}
