// modules/prescription/entities/prescription.entity.ts
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
  medicineName:  string;
  dosage:        string;
  frequency:     string;
  durationDays:  number;
  instructions?: string;
}

@Entity('prescriptions')
@Index(['doctorId'])
@Index(['doctorId', 'status'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Doctor relation ──────────────────────────────────────────────────────────

  /**
   * The UUID of the doctor who created this prescription.
   * Always extracted from the JWT — never from the request body.
   */
  @Column({ name: 'doctor_id' })
  doctorId: string;

  /**
   * Full ManyToOne relation so Doctor.prescriptions (OneToMany) resolves correctly.
   * Not loaded eagerly — use doctorId for filtering.
   */
  @ManyToOne(() => Doctor, (doctor) => doctor.prescriptions, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  // ── Appointment link (optional) ──────────────────────────────────────────────

  /**
   * The appointment this prescription was created for.
   * When set, the appointment is auto-completed and cannot get a second prescription.
   */
  @Column({ name: 'appointment_id', nullable: true, type: 'uuid' })
  appointmentId: string | null;

  @OneToOne(() => Appointment, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  // ── Patient info (free-text — no patient table FK required) ─────────────────

  /**
   * Optional free-text patient reference e.g. "P-00124".
   * Not a FK — the patient table relation can be added later.
   */
  @Column({ name: 'patient_id', nullable: true, type: 'varchar', length: 100 })
  patientId: string | null;

  @Column({ name: 'patient_name', length: 200 })
  patientName: string;

  @Column({ name: 'patient_age', type: 'int' })
  patientAge: number;

  // ── Clinical fields ──────────────────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** ISO date string YYYY-MM-DD */
  @Column({ name: 'issued_date', type: 'date' })
  issuedDate: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: string | null;

  /**
   * Medicines stored as JSONB array — no separate table needed.
   */
  @Column({ type: 'jsonb', default: '[]' })
  medicines: MedicineItem[];

  // ── Status ───────────────────────────────────────────────────────────────────

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
    nullable: true,   // nullable so discontinued/completed rows can be queried cleanly
  })
  status: PrescriptionStatus | null;

  // ── Timestamps ───────────────────────────────────────────────────────────────

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
