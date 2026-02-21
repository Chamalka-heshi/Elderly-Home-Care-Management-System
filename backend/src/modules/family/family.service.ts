/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(FamilyMember)
    private familyRepository: Repository<FamilyMember>,
    private usersService: UsersService,
  ) {}

  async create(data: {
    user: User;
    fullName: string;
    contactNumber: string;
    address?: string;
    emergencyContact?: string;
  }): Promise<FamilyMember> {
    const familyMember = this.familyRepository.create({
      user: data.user,
      fullName: data.fullName,
      contactNumber: data.contactNumber,
    });

    return this.familyRepository.save(familyMember);
  }

  async findByUserId(userId: string): Promise<FamilyMember | null> {
    return this.familyRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'patients'],
    });
  }

  async findById(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyRepository.findOne({
      where: { id },
      relations: ['user', 'patients'],
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    return familyMember;
  }

  async findAll(): Promise<FamilyMember[]> {
    return this.familyRepository.find({
      relations: ['user', 'patients'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<FamilyMember[]> {
    return this.familyRepository.find({
      where: { user: { isActive: true } },
      relations: ['user', 'patients'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateData: Partial<Pick<FamilyMember, 'fullName' | 'contactNumber'>>): Promise<FamilyMember> {
    if (!id) {
      throw new BadRequestException('Family member ID is required');
    }

    await this.familyRepository.update({ id }, updateData);
    return this.findById(id);
  }

  /**
   * Deactivate is handled entirely via User.isActive — single source of truth.
   */
  async deactivate(id: string): Promise<void> {
    if (!id) throw new BadRequestException('Family member ID is required');
    const member = await this.findById(id);
    await this.usersService.deactivateUser(member.user.id);
  }

  async activate(id: string): Promise<void> {
    if (!id) throw new BadRequestException('Family member ID is required');
    const member = await this.findById(id);
    await this.usersService.activateUser(member.user.id);
  }
}
