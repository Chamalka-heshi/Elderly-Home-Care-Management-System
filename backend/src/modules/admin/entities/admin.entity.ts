/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ unique: true, nullable: true })
  nic: string;
}
