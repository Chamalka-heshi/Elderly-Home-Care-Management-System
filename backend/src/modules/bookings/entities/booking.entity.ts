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
import { Patient } from '../../patients/entities/patient.entity';
import { CarePlan, CarePlanDurationUnit } from '../../care-plan/entities/care-plan.entity';

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export class CarePlanSnapshot {
  name: string;
  price: number;
  duration: number;
  durationUnit: CarePlanDurationUnit;
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Family member who created the booking.
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => FamilyMember, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: FamilyMember;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'care_plan_id' })
  carePlanId: string;

  @ManyToOne(() => CarePlan, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'care_plan_id' })
  carePlan: CarePlan;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_PAYMENT,
  })
  status: BookingStatus;

  @Column({ name: 'care_plan_snapshot', type: 'jsonb' })
  carePlanSnapshot: CarePlanSnapshot;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
