/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('caregivers')
export class Caregiver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  fullName: string;

  @Column({ unique: true })
  nic: string;

  @Column()
  contactNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ type: 'int', nullable: true })
  experienceYears: number;

  // Using simple-json to safely handle arrays with special characters
  @Column({ type: 'simple-json', nullable: true })
  specializations: string[];

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'simple-json', nullable: true })
  availableShifts: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
