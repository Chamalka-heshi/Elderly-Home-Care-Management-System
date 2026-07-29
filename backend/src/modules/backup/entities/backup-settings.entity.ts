import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

export type BackupFrequency = 'hourly' | '6hours' | 'daily' | 'weekly' | 'monthly';

// Singleton configuration entity — only one row should exist
@Entity('backup_settings')
export class BackupSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  autoBackupEnabled: boolean;

  @Column({ type: 'varchar', default: 'daily' })
  frequency: BackupFrequency;

  @Column({ default: '02:00' })
  backupTime: string;

  @Column({ default: 10 })
  maxBackupsToKeep: number;

  @Column({ default: true })
  compressionEnabled: boolean;

  @Column({ default: true })
  includeDatabase: boolean;

  @Column({ default: false })
  includeFiles: boolean;

  @Column({ default: './backups' })
  backupLocation: string;

  @Column({ nullable: true })
  emailNotification: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
