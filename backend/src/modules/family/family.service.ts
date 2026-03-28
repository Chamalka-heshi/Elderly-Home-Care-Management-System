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
