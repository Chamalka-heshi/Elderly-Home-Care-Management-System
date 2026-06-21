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

  @Column({
    type: 'varchar',
    length: 150,
  })
  fullName: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  nic: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  bloodGroup: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactNumber: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  drugAllergies: string;

  @Column({ type: 'text', nullable: true })
  foodAllergies: string;

  @Column({ type: 'text', nullable: true })
  environmentalAllergies: string;

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

  /** Set when family member selects a plan on the payments page: BASIC | REGULAR | PREMIUM */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentPlan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
