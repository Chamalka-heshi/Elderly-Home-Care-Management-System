import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Doctor } from '../../doctors/entities/doctor.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';

export interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

// Represents a formal clinical order for medication or treatment, capturing patient details and administrative metadata.
@Entity('prescriptions')
@Index(['doctorId'])
@Index(['doctorId', 'status'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The professional clinical identifier of the doctor responsible for issuing these instructions.
  @Column({ name: 'doctor_id' })
  doctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.prescriptions, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  // Link to the specific consultation session where these instructions were formulated.
  @Column({ name: 'appointment_id', nullable: true, type: 'uuid' })
  appointmentId: string | null;

  @OneToOne(() => Appointment, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  @Column({ name: 'patient_id', nullable: true, type: 'varchar', length: 100 })
  patientId: string | null;

  @Column({ name: 'patient_name', length: 200 })
  patientName: string;

  @Column({ name: 'patient_age', type: 'int' })
  patientAge: number;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'issued_date', type: 'date' })
  issuedDate: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: string | null;

  // Comprehensive list of medication instructions stored in a structured temporal format.
  @Column({ type: 'jsonb', default: '[]' })
  medicines: MedicineItem[];

  // Tracks the operational state of the treatment course, from active administration to completion or termination.
  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
    nullable: true,
  })
  status: PrescriptionStatus | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
