import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Prescription } from '../../prescription/entities/prescription.entity';
import { ChannelingSlot } from '../../channeling-slot/entities/channeling-slot.entity';

// Extends the core user identity with professional credentials, clinical specializations, and operational availability.
@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: false, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  nic: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  specialization: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  licenseNumber: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  qualification: string;

  @Column({ type: 'int' })
  experienceYears: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  hospitalAffiliation: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ type: 'simple-json', nullable: true })
  availableDays: string[];

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  availableTimeStart: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  availableTimeEnd: string;

  @OneToMany(() => Prescription, (prescription) => prescription.doctor, {
    cascade: false,
    eager: false,
  })
  prescriptions: Prescription[];

  @OneToMany(() => ChannelingSlot, (slot) => slot.doctor, {
    cascade: false,
    eager: false,
  })
  channelingSlots: ChannelingSlot[];
}
