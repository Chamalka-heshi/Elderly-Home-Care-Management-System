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

  /**
   * Creates a FamilyMember profile record linked to an existing User.
   * fullName and contactNumber are already stored on the User record.
   */
  async create(data: { user: User }): Promise<FamilyMember> {
    const familyMember = this.familyRepository.create({ user: data.user });
    return this.familyRepository.save(familyMember);
  }

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
      order: { user: { createdAt: 'DESC' } } as any,
    });
  }

  async findAllActive(): Promise<FamilyMember[]> {
    return this.familyRepository.find({
      where: { user: { isActive: true } },
      relations: ['user', 'patients'],
      order: { user: { createdAt: 'DESC' } } as any,
    });
  }

  /**
   * Update common profile fields via the User record (cascade saves automatically).
   */
  async update(
    id: string,
    updateData: Partial<Pick<User, 'fullName' | 'contactNumber'>>,
  ): Promise<FamilyMember> {
    if (!id) throw new BadRequestException('Family member ID is required');

    const member = await this.findById(id);

    if (updateData.fullName) member.user.fullName = updateData.fullName;
    if (updateData.contactNumber) member.user.contactNumber = updateData.contactNumber;

    return this.familyRepository.save(member);
  }

  /**
   * Update the profile of the currently logged-in family member using their userId.
   * Uses usersService.update() directly (consistent with Doctor/Caregiver pattern)
   * and re-fetches from DB to return a fresh, fully-populated entity.
   */
  async updateProfileByUserId(
    userId: string,
    dto: UpdateFamilyProfileDto,
  ): Promise<FamilyMember> {
    const member = await this.familyRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Family member profile not found');
    }

    // Update user fields directly via UsersService (avoids relying on cascade save)
    if (dto.fullName || dto.contactNumber) {
      await this.usersService.update(member.user.id, {
        ...(dto.fullName      && { fullName: dto.fullName }),
        ...(dto.contactNumber && { contactNumber: dto.contactNumber }),
      });
    }

    // Re-fetch from DB so the returned entity has fresh, consistent user fields
    return this.findByUserId(userId) as Promise<FamilyMember>;
  }

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