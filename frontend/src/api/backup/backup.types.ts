// ── Data shapes returned by the backup API ──────────────────────────────────

export type BackupStatus    = 'pending' | 'running' | 'success' | 'failed';
export type BackupType      = 'manual' | 'scheduled' | 'pre-restore';
export type BackupFrequency = 'hourly' | '6hours' | 'daily' | 'weekly' | 'monthly';

export interface BackupRecord {
  id: string;
  backupName: string;
  backupType: BackupType;
  status: BackupStatus;
  fileSizeBytes: number;
  s3Key: string | null;
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

export interface VerifyResponse {
  valid: boolean;
  checksumValid: boolean | null;
  structureValid: boolean;
  tables: string[];
  rowCounts: Record<string, number>;
  snapshotDate: string | null;
  details: string;
}

export interface BackupSettings {
  id: string;
  autoBackupEnabled: boolean;
  frequency: BackupFrequency;
  backupTime: string;
  maxBackupsToKeep: number;
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

export interface RestoreResponse {
  message: string;
  tablesRestored: number;
}
