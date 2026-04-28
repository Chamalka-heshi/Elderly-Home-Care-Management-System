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
import { Patient }        from '../../patients/entities/patient.entity';
import { FamilyMember }   from '../../family/entities/family-member.entity';

export enum AppointmentStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING         = 'pending',
  CONFIRMED       = 'confirmed',
  CANCELLED       = 'cancelled',
  COMPLETED       = 'completed',
}



// Represents a scheduled medical consultation, linking patients and doctors through a specific channeling slot.
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'slot_id' })
  slotId: string;

  @ManyToOne(() => ChannelingSlot, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slot_id' })
  slot: ChannelingSlot;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'family_member_id' })
  familyMemberId: string;

  @ManyToOne(() => FamilyMember, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_member_id' })
  familyMember: FamilyMember;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING_PAYMENT,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'prescription_id', nullable: true, type: 'uuid' })
  prescriptionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}