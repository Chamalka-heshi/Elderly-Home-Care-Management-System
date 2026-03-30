import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity('care_notes')
export class CareNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  residentId: string;

  @Column({ type: 'uuid' })
  caregiverId: string;

  @Column({ type: 'text' })
  note: string;

  @Column({ default: 'general' })
  category: string; // 'general' | 'medical' | 'behavioral'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}