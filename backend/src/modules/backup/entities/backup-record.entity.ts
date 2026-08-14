import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Valid backup types
export type BackupStatus = 'pending' | 'running' | 'success' | 'failed';
export type BackupType   = 'manual' | 'scheduled' | 'pre-restore';

// Stores metadata for every backup snapshot created by the system.
// All backups are stored exclusively in AWS S3.
@Entity('backup_records')
export class BackupRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  backupName: string;

  @Column({ type: 'varchar', default: 'manual' })
  backupType: BackupType;

  @Column({ type: 'varchar', default: 'pending' })
  status: BackupStatus;

  @Column({ type: 'bigint', default: 0 })
  fileSizeBytes: number;

  // S3 object key — e.g. "backups/backup_manual_2026-08-14_00-27-00.json.gz"
  @Column({ nullable: true })
  s3Key: string;

  // SHA-256 hex digest of the compressed (.json.gz) buffer — used to verify integrity before restore.
  // 64 hex characters = 256 bits. Null for older backups created before this feature was added.
  @Column({ nullable: true, length: 64 })
  checksum: string | null;

  @Column({ default: '1.0.0' })
  backupVersion: string;

  @Column({ nullable: true })
  databaseVersion: string;

  @Column({ nullable: true })
  createdByUserId: string;

  @Column({ nullable: true })
  createdByName: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
