/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Stores caregiver-specific data.
 * Common fields (fullName, contactNumber, createdAt, updatedAt)
 * live on the User entity.
 */
@Entity('caregivers')
export class Caregiver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  // ── Caregiver-specific fields ────────────────────────────────────────────
  @Column({ unique: true })
  nic: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ type: 'int', nullable: true })
  experienceYears: number;

  @Column({ type: 'simple-json', nullable: true })
  specializations: string[];

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'simple-json', nullable: true })
  availableShifts: string[];
}
