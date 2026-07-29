import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ActivityAction =
  | 'BACKUP_CREATED'
  | 'BACKUP_DOWNLOADED'
  | 'BACKUP_DELETED'
  | 'BACKUP_VERIFIED'
  | 'RESTORE_STARTED'
  | 'RESTORE_COMPLETED'
  | 'RESTORE_FAILED'
  | 'SETTINGS_UPDATED'
  | 'SCHEDULER_TRIGGERED';

// Immutable audit trail of all backup-related actions performed in the system
@Entity('backup_activity_logs')
export class BackupActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  action: ActivityAction;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  backupId: string;

  @Column({ nullable: true })
  backupName: string;

  @Column({ type: 'varchar', default: 'success' })
  status: 'success' | 'failed' | 'info';

  @Column({ nullable: true, type: 'text' })
  details: string;

  @CreateDateColumn()
  createdAt: Date;
}
