import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Doctor } from '../../doctors/entities/doctor.entity';

export enum SlotStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Represents a specific time window reserved for medical consultations, tracking availability, fees, and doctor acceptance.
@Entity('channeling_slots')
export class ChannelingSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @ManyToOne(() => Doctor, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', length: 5 })
  startTime: string;

  @Column({ name: 'end_time', length: 5 })
  endTime: string;

  @Column({ name: 'booking_cutoff_minutes', default: 15 })
  bookingCutoffMinutes: number;

  @Column({ name: 'max_patients', default: 20 })
  maxPatients: number;

  @Column({
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.PENDING,
  })
  status: SlotStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    name: 'care_home_fee',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  careHomeFee: number | null;

  @Column({
    name: 'consultation_fee',
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  consultationFee: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
