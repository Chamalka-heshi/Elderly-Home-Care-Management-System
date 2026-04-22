/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vital_records')
export class VitalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  caregiverId: string;

  @Column({ nullable: true })
  bloodPressure: string; // e.g. "120/80"

  @Column({ type: 'int', nullable: true })
  heartRate: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'int', nullable: true })
  oxygenSaturation: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  weight: number;

  @Column({ default: 'Normal' })
  status: string; // 'Normal' | 'Warning' | 'Critical'

  @CreateDateColumn()
  recordedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
