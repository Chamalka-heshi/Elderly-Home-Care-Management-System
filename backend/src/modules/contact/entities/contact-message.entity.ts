import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MessageStatus = 'pending' | 'replied';

// Captures individual user inquiries submitted through the contact portal, tracking their lifecycle from submission to resolution.
@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column('text')
  message: string;
  @Column('text', { nullable: true })
  reply?: string;

  @Column({ nullable: true })
  repliedAt?: Date;

  @Column({ nullable: true })
  repliedByAdminId?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
