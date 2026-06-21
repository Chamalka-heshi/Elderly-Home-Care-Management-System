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

  @Column({ name: 'phone_primary', type: 'varchar', length: 20 })
  phonePrimary: string;

  @Column({ name: 'phone_emergency', type: 'varchar', length: 20, nullable: true })
  phoneEmergency: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 255 })
  addressLine1: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'open_hours', type: 'varchar', length: 255, nullable: true })
  openHours: string;

  @Column({ name: 'map_url', type: 'varchar', length: 1000, nullable: true })
  mapUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
