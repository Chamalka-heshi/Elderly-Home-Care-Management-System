import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BackupStatus = 'pending' | 'running' | 'success' | 'failed';
export type BackupType   = 'manual' | 'scheduled' | 'pre-restore';

// Stores metadata for every backup snapshot created by the system
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

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  checksum: string;

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
