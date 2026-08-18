import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { FamilyMember } from '../../family/entities/family-member.entity';

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Care-plan booking reference (nullable) ──────────────────────────────────
  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @ManyToOne(() => Booking, {
    eager: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking | null;

  // ── Doctor appointment reference (nullable) ─────────────────────────────────
  // Exactly ONE of bookingId / appointmentId is set per payment row.
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @ManyToOne(() => Appointment, {
    eager: false,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  // ── Family member (payer) ───────────────────────────────────────────────────
  // userId here stores the FamilyMember.id (not User.id) for the FK to work.
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => FamilyMember, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: FamilyMember;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'payhere_payment_id', type: 'varchar', length: 64, nullable: true })
  payherePaymentId: string | null;

  @Column({ name: 'payhere_order_id', type: 'varchar', length: 64, nullable: true })
  payhereOrderId: string | null;

  @Column({ name: 'gateway_status_code', type: 'varchar', length: 16, nullable: true })
  gatewayStatusCode: string | null;

  @Column({ name: 'gateway_status_message', type: 'text', nullable: true })
  gatewayStatusMessage: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
