/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  // ── Doctor-specific fields ───────────────────────────────────────────────
  @Column()
  specialization: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  qualification: string;

  @Column({ type: 'int' })
  experienceYears: number;

  @Column({ nullable: true })
  hospitalAffiliation: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ type: 'simple-json', nullable: true })
  availableDays: string[];

  @Column({ nullable: true })
  availableTimeStart: string;

  @Column({ nullable: true })
  availableTimeEnd: string;
}
