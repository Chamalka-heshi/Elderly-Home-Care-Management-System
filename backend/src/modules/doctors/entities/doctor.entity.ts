/* eslint-disable prettier/prettier */
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

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: false, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

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