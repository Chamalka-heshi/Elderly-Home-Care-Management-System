import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FamilyMember } from '../../family/entities/family-member.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  nic: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactNumber: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  currentMedications: string;

  @Column({ type: 'text', nullable: true })
  chronicConditions: string;

  @ManyToOne(() => FamilyMember, (family) => family.patients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'familyMemberId' })
  familyMember: FamilyMember;

  @Column()
  familyMemberId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}