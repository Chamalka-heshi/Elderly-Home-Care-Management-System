import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChannelingSlot } from '../../channeling-slot/entities/channeling-slot.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { FamilyMember } from '../../family/entities/family-member.entity';

export enum AppointmentStatus {
  PENDING_PAYMENT = 'pending_payment', // newly added — family created, awaiting payment
  PENDING         = 'pending',         // paid (or admin-created); awaiting doctor confirmation
  CONFIRMED       = 'confirmed',
  CANCELLED       = 'cancelled',
  COMPLETED       = 'completed',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Slot reference ──────────────────────────────────────────────────────────
  @Column({ name: 'slot_id' })
  slotId: string;

  @ManyToOne(() => ChannelingSlot, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slot_id' })
  slot: ChannelingSlot;

  // ── Patient reference ───────────────────────────────────────────────────────
  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // ── Family member who made the booking ─────────────────────────────────────
  @Column({ name: 'family_member_id' })
  familyMemberId: string;

  @ManyToOne(() => FamilyMember, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_member_id' })
  familyMember: FamilyMember;

  // ── Status ──────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING_PAYMENT,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ── Prescription link (set when doctor creates prescription for this appointment)
  @Column({ name: 'prescription_id', nullable: true, type: 'uuid' })
  prescriptionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}