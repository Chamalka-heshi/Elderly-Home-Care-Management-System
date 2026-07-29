import { apiFetch, API_BASE_URL, getCsrfToken } from '../core/apiClient';
import type {
  BackupStats,
  BackupListResponse,
  BackupRecord,
  BackupSettings,
  ActivityLogsResponse,
  VerifyResult,
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

// ── Download ───────────────────────────────────────────────────────────────

export const downloadBackup = async (id: string, backupName: string): Promise<void> => {
  const csrfToken = getCsrfToken();
  const res = await fetch(`${API_BASE_URL}/backup/${id}/download`, {
    credentials: 'include',
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupName;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Delete ─────────────────────────────────────────────────────────────────

export const deleteBackup = (id: string): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/backup/${id}`, { method: 'DELETE' });

// ── Verify ─────────────────────────────────────────────────────────────────

export const verifyBackup = (id: string): Promise<VerifyResult> =>
  apiFetch<VerifyResult>(`/backup/${id}/verify`, { method: 'POST' });

// ── Restore ────────────────────────────────────────────────────────────────

export const restoreBackup = (id: string): Promise<{ message: string }> =>
  apiFetch<{ message: string }>(`/backup/${id}/restore`, { method: 'POST' });

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
