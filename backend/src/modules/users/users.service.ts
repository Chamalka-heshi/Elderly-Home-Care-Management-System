import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import * as bcrypt          from 'bcrypt';

import { User }     from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}


  // Creates a new master user record with hashed credentials, serving as the foundation for role-specific profiles.
  async create(
    email:          string,
    password:       string,
    role:           UserRole,
    fullName:       string,
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

  // Locates a user by their unique email address, explicitly including the password hash for authentication workflows.
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // Retrieves core user data by its identifier, typically used for session validation and profile rendering.
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Returns a full user record including the secure password hash, used for credential verification during sensitive operations.
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  // Verification & Security
  // Compares a plaintext password attempt against a stored cryptographic hash to authorize access.
  async validatePassword(
    plainPassword:  string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Securely updates a user's password after hashing it, invalidating old credentials.
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password        = hashedPassword;
    await this.userRepository.save(user);
  }

  // Enforces a requirement for the user to change their password upon their next successful login.
  async setMustChangePassword(userId: string, value: boolean): Promise<void> {
    await this.userRepository.update(userId, { mustChangePassword: value });
  }

  // Disables a user's system access without deleting their historical data or associated profiles.
  async deactivateUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isActive = false;
    await this.userRepository.save(user);
  }

  // Re-enables access for a previously suspended user account.
  async activateUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isActive = true;
    await this.userRepository.save(user);
  }

  // Records the timestamp of the user's last session termination to assist with security auditing and session management.
  async setLastLogoutAt(userId: string, date: Date | null): Promise<void> {
    await this.userRepository.update(userId, { lastLogoutAt: date });
  }

  // Permanently removes a user record and its credentials from the system.
  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId); 
    if (!user) throw new NotFoundException('User not found');
    
    await this.userRepository.delete(userId);
  }

  // Updates basic contact and identity information within the master user record.
  async update(userId: string, data: Partial<{ fullName: string; contactNumber: string }>) {
    await this.userRepository.update(userId, data);
  }

  // Updates the public-facing avatar URL for the user's profile across all platform interfaces.
  async updateAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    await this.userRepository.update(userId, { avatarUrl });
  }
}