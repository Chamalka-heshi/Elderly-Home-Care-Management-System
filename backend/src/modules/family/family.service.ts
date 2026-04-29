/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateFamilyProfileDto } from './dto/update-family-profile.dto';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(FamilyMember)
    private familyRepository: Repository<FamilyMember>,
    private usersService: UsersService,
  ) {}

//Initializes a family member profile record linked to a core user identity to enable account-specific data tracking
  async create(data: { user: User }): Promise<FamilyMember> {
    const familyMember = this.familyRepository.create({ user: data.user });
    return this.familyRepository.save(familyMember);
  }

//Resolves the family profile for a specific system user to support personalized dashboard interactions
  async findByUserId(userId: string): Promise<FamilyMember | null> {
    return this.familyRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'patients'],
      select: {
        id: true,
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

//Retrieves granular details for a specific family member to facilitate targeted administrative actions
  async findById(id: string): Promise<FamilyMember> {
    const familyMember = await this.familyRepository.findOne({
      where: { id },
      relations: ['user', 'patients'],
    });

    if (!familyMember) throw new NotFoundException('Family member not found');
    return familyMember;
  }

//Returns all registered family members to provide a comprehensive overview for system administrators
  async findAll(): Promise<FamilyMember[]> {
    return this.familyRepository.find({
      relations: ['user', 'patients'],
      order: { user: { createdAt: 'DESC' } } as any,
    });
  }

//Synchronizes profile updates across core user records to maintain data consistency during account edits
  async updateProfileByUserId(
    userId: string,
    dto: UpdateFamilyProfileDto,
  ): Promise<FamilyMember> {
    const member = await this.familyRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!member) throw new NotFoundException('Family member profile not found');

    if (dto.fullName || dto.contactNumber) {
      await this.usersService.update(member.user.id, {
        ...(dto.fullName      && { fullName: dto.fullName }),
        ...(dto.contactNumber && { contactNumber: dto.contactNumber }),
      });
    }

    return this.findByUserId(userId) as Promise<FamilyMember>;
  }
}