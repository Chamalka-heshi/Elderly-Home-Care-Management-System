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
import { UpdateCaregiverProfileDto } from './dto/update-caregiver-profile.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class CaregiversService {
  constructor(
    @InjectRepository(Caregiver)
    private caregiverRepository: Repository<Caregiver>,
    private usersService: UsersService,
  ) {}

  async create(createCaregiverDto: CreateCaregiverDto): Promise<Caregiver> {
    const { email, password, fullName, contactNumber, certifications, ...caregiverData } = createCaregiverDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // password is injected by auth.service (auto-generated); never comes from the request body
    if (!password) {
      throw new BadRequestException('Password is required for account creation');
    }

    // fullName and contactNumber are stored on the User record
    const user = await this.usersService.create(
      email,
      password,
      UserRole.CAREGIVER,
      fullName,
      contactNumber,
    );

    const caregiver = this.caregiverRepository.create({
      user,
      nic: caregiverData.nic ?? undefined,
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
      order: { user: { createdAt: 'DESC' } },
    });
  }

  async findAllActive(): Promise<Caregiver[]> {
    return this.caregiverRepository.find({
      where: { user: { isActive: true } },
      relations: ['user'],
      order: { user: { createdAt: 'DESC' } },
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
      select: {
        id: true,
        nic: true,
        address: true,
        qualification: true,
        experienceYears: true,
        specializations: true,
        emergencyContact: true,
        availableShifts: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          contactNumber: true,
          isActive: true,
          createdAt: true,
        },
      },
    });
  }

  async deactivate(id: string): Promise<void> {
    const caregiver = await this.findOne(id);
    await this.usersService.deactivateUser(caregiver.user.id);
  }

  async activate(id: string): Promise<void> {
    const caregiver = await this.findOne(id);
    await this.usersService.activateUser(caregiver.user.id);
  }

  async updateProfileByUserId(
    userId: string,
    dto: UpdateCaregiverProfileDto,
  ): Promise<Caregiver> {
    const caregiver = await this.findByUserId(userId);
    if (!caregiver) {
      throw new NotFoundException('Caregiver profile not found');
    }

    // Update base user fields (fullName, contactNumber)
    if (dto.fullName || dto.contactNumber) {
      await this.usersService.update(caregiver.user.id, {
        ...(dto.fullName    && { fullName: dto.fullName }),
        ...(dto.contactNumber && { contactNumber: dto.contactNumber }),
      });
    }

    // Update caregiver-specific fields
    if (dto.address          !== undefined) caregiver.address          = dto.address;
    if (dto.qualification    !== undefined) caregiver.qualification    = dto.qualification;
    if (dto.experienceYears  !== undefined) caregiver.experienceYears  = dto.experienceYears;
    if (dto.specializations  !== undefined) caregiver.specializations  = dto.specializations;
    if (dto.emergencyContact !== undefined) caregiver.emergencyContact = dto.emergencyContact;
    if (dto.availableShifts  !== undefined) caregiver.availableShifts  = dto.availableShifts;

    await this.caregiverRepository.save(caregiver);

    // Re-fetch from DB so the returned entity has a fresh, consistent user relation
    return this.findByUserId(userId) as Promise<Caregiver>;
  }
}