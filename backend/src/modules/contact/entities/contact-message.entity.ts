import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MessageStatus = 'pending' | 'replied';

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

  // ── Reply fields ──────────────────────────────────────────────────────────

  @Column('text', { nullable: true })
  reply?: string;

  @Column({ nullable: true })
  repliedAt?: Date;

  @Column({ nullable: true })
  repliedByAdminId?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: MessageStatus;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}