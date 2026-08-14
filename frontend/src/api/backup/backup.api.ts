import { apiFetch } from '../core/apiClient';
import type {
  BackupStats,
  BackupListResponse,
  BackupRecord,
  BackupSettings,
  ActivityLogsResponse,
  RestoreResponse,
  VerifyResponse,
} from './backup.types';

// ── Stats ──────────────────────────────────────────────────────────────────

export const getBackupStats = (): Promise<BackupStats> =>
  apiFetch<BackupStats>('/backup/stats');

// ── Backup List ────────────────────────────────────────────────────────────

export const listBackups = (
  page = 1,
  limit = 20,
  search = '',
): Promise<BackupListResponse> =>
  apiFetch<BackupListResponse>(`/backup/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

// ── Create Manual Backup ───────────────────────────────────────────────────

export const createBackup = (notes?: string): Promise<BackupRecord> =>
  apiFetch<BackupRecord>('/backup/create', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

// ── Delete ─────────────────────────────────────────────────────────────────

export const deleteBackup = (id: string): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/backup/${id}`, { method: 'DELETE' });

// ── Settings ───────────────────────────────────────────────────────────────

export const getBackupSettings = (): Promise<BackupSettings> =>
  apiFetch<BackupSettings>('/backup/settings');

export const updateBackupSettings = (
  payload: Partial<BackupSettings>,
): Promise<BackupSettings> => {
  // Strip read-only entity fields — the backend DTO rejects unknown properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, ...body } = payload as BackupSettings;
  return apiFetch<BackupSettings>('/backup/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

// ── Activity Logs ──────────────────────────────────────────────────────────

export const getActivityLogs = (
  page = 1,
  limit = 50,
): Promise<ActivityLogsResponse> =>
  apiFetch<ActivityLogsResponse>(`/backup/activity-logs?page=${page}&limit=${limit}`);

// ── Restore ───────────────────────────────────────────────────────────────

export const restoreBackup = (id: string): Promise<RestoreResponse> =>
  apiFetch<RestoreResponse>(`/backup/${id}/restore`, { method: 'POST' });

// ── Verify ────────────────────────────────────────────────────────────────

export const verifyBackup = (id: string): Promise<VerifyResponse> =>
  apiFetch<VerifyResponse>(`/backup/${id}/verify`, { method: 'POST' });
