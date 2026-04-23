/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    contactNumber?: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role,
      fullName,
      contactNumber,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);
  }

  async activateUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    await this.userRepository.save(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  async update(userId: string, data: Partial<{ fullName: string; contactNumber: string }>) {
    await this.userRepository.update(userId, data);
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    await this.userRepository.update(userId, { avatarUrl });
  }

  async setMustChangePassword(userId: string, value: boolean): Promise<void> {
    await this.userRepository.update(userId, { mustChangePassword: value });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId); 
    if (!user) {
      throw new NotFoundException('User not found');
    } 
    await this.userRepository.delete(userId);
  }
}