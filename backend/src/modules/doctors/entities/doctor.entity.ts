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

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  qualification: string;

  @Column({ type: 'int' })
  experienceYears: number;

  @Column()
  contactNumber: string;

  @Column({ nullable: true })
  hospitalAffiliation: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  // Using simple-json to safely handle arrays with special characters
  @Column({ type: 'simple-json', nullable: true })
  availableDays: string[];

  @Column({ nullable: true })
  availableTimeStart: string; // '09:00'

  @Column({ nullable: true })
  availableTimeEnd: string; // '17:00'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
