import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserRole } from '../../../common/enums/user-role.enum';


// Represents the master identity record for all system participants, managing authentication, role authorization, and secure session state.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  // Hashed credentials are excluded from default queries to prevent accidental exposure in application logs or API responses.
  @Column({ select: false })
  password: string;

  // Determines the user's primary permission level and controls access to specialized modules like clinical dashboard or administrative tools.
  @Column({
    type:    'enum',
    enum:    UserRole,
    default: UserRole.FAMILY,
  })
  role: UserRole;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ default: true })
  isActive: boolean;

  // Enforces a secure workflow requiring users to choose new credentials upon their first or recovery-based login.
  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  // The unique identifier provided by the identity provider for federated authentication flows.
  @Column({ type: 'varchar', nullable: true, unique: true, name: 'firebase_uid' })
  firebaseUid: string | null;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  // Tracks the timestamp of the most recent session termination to facilitate global token invalidation and security auditing.
  @Column({ type: 'timestamptz', nullable: true, name: 'last_logout_at' })
  lastLogoutAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}