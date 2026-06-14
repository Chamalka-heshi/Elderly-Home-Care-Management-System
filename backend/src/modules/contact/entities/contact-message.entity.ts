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

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column('text')
  message: string;
  @Column('text', { nullable: true })
  reply?: string;

  @Column({ nullable: true })
  repliedAt?: Date;

  @Column({ nullable: true })
  repliedByAdminId?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
