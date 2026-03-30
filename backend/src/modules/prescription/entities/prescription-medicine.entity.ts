// src/modules/prescription/entities/prescription-medicine.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Prescription } from './prescription.entity';

@Entity('prescription_medicines')
export class PrescriptionMedicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prescription_id', type: 'uuid' })
  prescriptionId: string;

  @Column({ name: 'medicine_name' })
  medicineName: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column({ name: 'duration_days', type: 'int' })
  durationDays: number;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @ManyToOne(() => Prescription, (p) => p.medicines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;
}
