// ── Data shapes returned by the backup API ──────────────────────────────────

export type BackupStatus    = 'pending' | 'running' | 'success' | 'failed';
export type BackupType      = 'manual' | 'scheduled' | 'pre-restore';
export type BackupFrequency = 'hourly' | '6hours' | 'daily' | 'weekly' | 'monthly';
export type StorageType     = 'LOCAL' | 'S3';
export type StorageLocation = 'LOCAL' | 'S3';

export interface BackupRecord {
  id: string;
  backupName: string;
  backupType: BackupType;
  status: BackupStatus;
  fileSizeBytes: number;
  filePath: string | null;
  s3Key: string | null;
  s3Url: string | null;
  storageType: StorageType;
  checksum: string | null;
  backupVersion: string;
  databaseVersion: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  notes: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface BackupSettings {
  id: string;
  autoBackupEnabled: boolean;
  frequency: BackupFrequency;
  backupTime: string;
  maxBackupsToKeep: number;
  compressionEnabled: boolean;
  includeDatabase: boolean;
  includeFiles: boolean;
  storageLocation: StorageLocation;  // 'LOCAL' | 'S3'
  emailNotification: string | null;
  updatedAt: string;
}

export interface BackupActivityLog {
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  ipAddress: string | null;
  backupId: string | null;
  backupName: string | null;
  status: 'success' | 'failed' | 'info';
  details: string | null;
  createdAt: string;
}

export interface MonthlyBreakdown {
  label: string;
  count: number;
  success: number;
  failed: number;
}

export interface BackupStats {
  total: number;
  latest: BackupRecord | null;
  nextScheduled: string | null;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  success: number;
  failed: number;
  monthly: MonthlyBreakdown[];
  settings: BackupSettings;
}

export interface BackupListResponse {
  records: BackupRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ActivityLogsResponse {
  logs: BackupActivityLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VerifyResult {
  valid: boolean;
  storedChecksum: string;
  computedChecksum: string;
  reason: string;
}
