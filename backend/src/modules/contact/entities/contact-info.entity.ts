import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Stores the official facility contact details and location data used across the platform's public interfaces.
@Entity('contact_info')
export class ContactInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone_primary' })
  phonePrimary: string;

  @Column({ name: 'phone_emergency', nullable: true })
  phoneEmergency: string;

  @Column()
  email: string;

  @Column({ name: 'address_line1' })
  addressLine1: string;

  @Column({ name: 'address_line2', nullable: true })
  addressLine2: string;

  @Column()
  city: string;

  @Column({ name: 'open_hours', nullable: true })
  openHours: string;

  @Column({ name: 'map_url', nullable: true })
  mapUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
