import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

export type BackupFrequency = 'hourly' | '6hours' | 'daily' | 'weekly' | 'monthly';

// Singleton configuration entity — only one row should exist.
// Storage is always AWS S3; compression is always GZIP — neither is configurable.
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

  @Column({ nullable: true })
  emailNotification: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
