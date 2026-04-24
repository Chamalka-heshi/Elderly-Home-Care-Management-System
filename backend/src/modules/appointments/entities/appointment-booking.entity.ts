import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppointmentBookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('appointment_bookings')
export class AppointmentBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** User id (family member user) */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId: string | null;

  @Column({ name: 'caregiver_id', type: 'uuid', nullable: true })
  caregiverId: string | null;

  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: string;

  @Column({ name: 'appointment_time', type: 'varchar', length: 32 })
  appointmentTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentBookingStatus,
    default: AppointmentBookingStatus.PENDING_PAYMENT,
  })
  status: AppointmentBookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

