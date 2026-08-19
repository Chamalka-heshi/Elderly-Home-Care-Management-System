import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, EntityManager } from 'typeorm';
import * as zlib from 'zlib';
import * as crypto from 'crypto';
import { promisify } from 'util';

import { BackupRecord, BackupType } from './entities/backup-record.entity';
import { BackupSettings } from './entities/backup-settings.entity';
import { BackupActivityLog, ActivityAction } from './entities/backup-activity-log.entity';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { MailService } from '../mail/mail.service';
import { S3StorageService } from './s3-storage.service';

const gzip   = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ─────────────────────────────────────────────────────────────────────────────
// Advisory lock ID — unique integer used by PostgreSQL pg_advisory_xact_lock()
// to prevent two restore operations running at the same time.
// This number just needs to be unique within the application; the value itself
// has no special meaning.
const RESTORE_ADVISORY_LOCK_ID = 987_654_321;

// How long a backup may stay in 'running' status before being considered stuck.
// If the server crashes mid-backup the record stays at 'running' forever unless
// we clean it up on the next startup.
const STUCK_BACKUP_TIMEOUT_MINUTES = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot shape produced by createBackup and consumed by restoreBackup.
interface BackupSnapshot {
  version:   string;
  createdAt: string;
  createdBy: string;
  tables:    Record<string, unknown[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrates all backup operations, scheduler logic, retention enforcement,
// and restore.
// All backups are stored exclusively in AWS S3 (via S3StorageService, AWS SDK v3).
// GZIP compression (.json.gz) and AES-256 server-side encryption are always
// applied.  SHA-256 checksum is calculated over the compressed buffer for
// integrity verification.
@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private schedulerTimeout: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(BackupRecord)
    private readonly backupRepo: Repository<BackupRecord>,

    @InjectRepository(BackupSettings)
    private readonly settingsRepo: Repository<BackupSettings>,

    @InjectRepository(BackupActivityLog)
    private readonly logRepo: Repository<BackupActivityLog>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  // Called automatically by NestJS after all dependencies are injected.
  async onModuleInit(): Promise<void> {
    // ── 1. Bootstrap singleton settings row if it doesn't exist yet ───────────
    await this.initSettings().catch((err) =>
      this.logger.error('Failed to init backup settings', err),
    );

    // ── 2. Clean up stuck 'running' records from a previous server crash ──────
    // If the server was killed while a backup was in progress the record
    // stays at status='running' forever.  We detect these on startup and mark
    // them as failed so the UI shows an honest state.
    await this.cleanStuckBackups().catch((err) =>
      this.logger.error('Failed to clean stuck backups', err),
    );

    // ── 3. Start the auto-backup scheduler ───────────────────────────────────
    await this.rescheduleAuto().catch(() => {});
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────────────────────────────────────

  private async initSettings(): Promise<void> {
    const count = await this.settingsRepo.count();
    if (count === 0) {
      await this.settingsRepo.save(this.settingsRepo.create({}));
    }
  }

  async getSettings(): Promise<BackupSettings> {
    const settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      const fresh = this.settingsRepo.create({});
      return this.settingsRepo.save(fresh);
    }
    return settings;
  }

  async updateSettings(
    dto: UpdateBackupSettingsDto,
    userId: string,
    userName: string,
    ip: string,
  ): Promise<BackupSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    const saved = await this.settingsRepo.save(settings);

    await this.log('SETTINGS_UPDATED', userId, userName, ip, null, null, 'info', 'Backup settings updated');
    await this.rescheduleAuto();
    return saved;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Create Backup
  // ──────────────────────────────────────────────────────────────────────────

  async createBackup(
    dto: CreateBackupDto,
    type: BackupType,
    userId: string,
    userName: string,
    ip: string,
  ): Promise<BackupRecord> {
    const settings     = await this.getSettings();
    const timestamp    = new Date();
    const localTimeStr = this.getLocalTimestampStr(timestamp);
    const safeName     = `backup_${type}_${localTimeStr}`;

    // Create the DB record immediately with status='running' so the UI can
    // show the in-progress state even if the operation takes a while.
    const record = this.backupRepo.create({
      backupName:      safeName,
      backupType:      type,
      status:          'running',
      createdByUserId: userId,
      createdByName:   userName,
      notes:           dto?.notes ?? undefined,
      backupVersion:   '1.0.0',
      createdAt:       new Date(),
    });
    await this.backupRepo.save(record);

    let uploadedKey: string | null = null;

    try {
      // ── Step 1: Gather all entity table data ─────────────────────────────
      const snapshot: Record<string, unknown[]> = {};
      for (const meta of this.dataSource.entityMetadatas) {
        // Skip backup module's own tables to avoid circular references
        if (['backup_records', 'backup_settings', 'backup_activity_logs'].includes(meta.tableName)) {
          continue;
        }
        try {
          const rows = await this.dataSource.query(`SELECT * FROM "${meta.tableName}"`);
          snapshot[meta.tableName] = rows;
        } catch {
          // Table might not exist yet in this environment — skip gracefully
          snapshot[meta.tableName] = [];
        }
      }

      // ── Step 2: Serialise to JSON ─────────────────────────────────────────
      const snapshotJson: BackupSnapshot = {
        version:   '1.0.0',
        createdAt: timestamp.toISOString(),
        createdBy: userName,
        tables:    snapshot,
      };
      const jsonString = JSON.stringify(snapshotJson);

      // ── Step 3: GZIP compress (always enabled — plain JSON never stored) ──
      const fileBuffer = await gzip(Buffer.from(jsonString, 'utf8'));
      const fileName   = `${safeName}.json.gz`;

      // ── Step 4: SHA-256 checksum of the compressed buffer ─────────────────
      // We hash AFTER compression so that the stored checksum matches exactly
      // what is uploaded to and downloaded from S3.
      const checksum = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // ── Step 5: Upload to AWS S3 (sole storage backend) ───────────────────
      // AES-256 server-side encryption is applied by S3StorageService on every upload.
      const uploadResult = await this.s3StorageService.uploadBackup(fileBuffer, fileName);
      uploadedKey = uploadResult.key;

      // ── Step 6: Update DB record with success metadata ────────────────────
      const dbVersion = await this.getDatabaseVersion();
      record.s3Key           = uploadResult.key;
      record.fileSizeBytes   = uploadResult.size;
      record.checksum        = checksum;
      record.status          = 'success';
      record.databaseVersion = dbVersion;
      record.completedAt     = new Date();

      try {
        await this.backupRepo.save(record);
      } catch (dbErr) {
        // DB metadata save failed AFTER a successful S3 upload — orphaned S3
        // object.  Try to roll back by deleting the S3 object.
        this.logger.error('DB record update failed after S3 upload — attempting S3 rollback', dbErr);
        try {
          await this.s3StorageService.deleteBackup(uploadedKey);
          this.logger.log(`S3 rollback succeeded for key: ${uploadedKey}`);
        } catch (s3Err) {
          this.logger.error(`S3 rollback FAILED for key: ${uploadedKey} — orphaned object`, s3Err);
        }
        throw dbErr;
      }

      // ── Step 7: Audit log ─────────────────────────────────────────────────
      await this.log(
        'BACKUP_CREATED', userId, userName, ip, record.id, safeName, 'success',
        `Backup created (${this.formatBytes(fileBuffer.byteLength)}) — S3 key: ${record.s3Key} — SHA-256: ${checksum.slice(0, 8)}...`,
      );

      // ── Step 8: Email notification (fire-and-forget) ──────────────────────
      if (settings.emailNotification?.trim()) {
        this.mailService.sendBackupNotification(settings.emailNotification, {
          backupName:    record.backupName,
          status:        record.status,
          fileSizeBytes: Number(record.fileSizeBytes),
          errorMessage:  record.errorMessage ?? undefined,
          notes:         record.notes        ?? undefined,
          completedAt:   record.completedAt  ?? undefined,
        }).catch((err) =>
          this.logger.error('Failed to send backup email notification', err),
        );
      }

      // ── Step 9: Enforce retention policy ──────────────────────────────────
      await this.purgeOldBackups(settings.maxBackupsToKeep);

      return record;
    } catch (err) {
      this.logger.error('Backup failed', err);
      record.status       = 'failed';
      record.errorMessage = err instanceof Error ? err.message : 'Unknown error';
      record.completedAt  = new Date();
      await this.backupRepo.save(record);
      await this.log('BACKUP_FAILED', userId, userName, ip, record.id, safeName, 'failed', record.errorMessage);

      if (settings.emailNotification?.trim()) {
        this.mailService.sendBackupNotification(settings.emailNotification, {
          backupName:   record.backupName,
          status:       record.status,
          errorMessage: record.errorMessage ?? undefined,
          notes:        record.notes        ?? undefined,
          completedAt:  record.completedAt  ?? undefined,
        }).catch((e) =>
          this.logger.error('Failed to send backup failure email notification', e),
        );
      }

      throw new InternalServerErrorException('Backup creation failed: ' + record.errorMessage);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // List & Stats
  // ──────────────────────────────────────────────────────────────────────────

  async listBackups(page = 1, limit = 20, search = '') {
    const qb = this.backupRepo
      .createQueryBuilder('b')
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('b.backupName ILIKE :s OR b.backupType ILIKE :s OR b.status ILIKE :s', { s: `%${search}%` });
    }

    const [records, total] = await qb.getManyAndCount();
    return { records, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats() {
    const all     = await this.backupRepo.find({ order: { createdAt: 'DESC' } });
    const total   = all.length;
    const latest  = all[0] ?? null;
    const success = all.filter((r) => r.status === 'success').length;
    const failed  = all.filter((r) => r.status === 'failed').length;

    const totalBytes = all.reduce((sum, r) => sum + Number(r.fileSizeBytes || 0), 0);

    const settings      = await this.getSettings();
    const nextScheduled = settings.autoBackupEnabled
      ? this.computeNextRun(settings.frequency, settings.backupTime)
      : null;

    const monthly = this.computeMonthlyBreakdown(all);

    return {
      total,
      latest,
      nextScheduled,
      totalStorageBytes:     totalBytes,
      totalStorageFormatted: this.formatBytes(totalBytes),
      success,
      failed,
      monthly,
      settings,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete
  // ──────────────────────────────────────────────────────────────────────────

  async deleteBackup(id: string, userId: string, userName: string, ip: string): Promise<{ message: string }> {
    const record = await this.findRecord(id);

    if (record.s3Key) {
      try {
        await this.s3StorageService.deleteBackup(record.s3Key);
      } catch (err) {
        // Log the error but still remove the DB record; the orphaned S3 object
        // will be cleaned up by the bucket's lifecycle policy.
        this.logger.error(`S3 delete failed for backup ${id}: ${err instanceof Error ? err.message : err}`);
      }
    }

    await this.backupRepo.remove(record);
    await this.log('BACKUP_DELETED', userId, userName, ip, id, record.backupName, 'success', 'Backup deleted from S3');

    return { message: `Backup "${record.backupName}" deleted successfully` };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Verify Backup
  // ──────────────────────────────────────────────────────────────────────────
  // Downloads a backup from S3, verifies its SHA-256 checksum, decompresses
  // it, and validates its structure.  Does NOT modify the database in any way.

  async verifyBackup(
    id: string,
    userId: string,
    userName: string,
    ip: string,
  ): Promise<{
    valid:         boolean;
    checksumValid: boolean | null;
    structureValid: boolean;
    tables:        string[];
    rowCounts:     Record<string, number>;
    snapshotDate:  string | null;
    details:       string;
  }> {
    const record = await this.findRecord(id);

    if (!record.s3Key) {
      throw new InternalServerErrorException('Backup has no S3 key — cannot verify.');
    }

    // ── Download from S3 ─────────────────────────────────────────────────────
    const compressedBuffer = await this.s3StorageService.downloadBackup(record.s3Key);

    // ── SHA-256 verification ─────────────────────────────────────────────────
    const computedChecksum = crypto
      .createHash('sha256')
      .update(compressedBuffer)
      .digest('hex');

    let checksumValid: boolean | null = null;
    if (record.checksum) {
      // Use timing-safe comparison to be thorough
      const a = Buffer.from(computedChecksum, 'utf8');
      const b = Buffer.from(record.checksum,   'utf8');
      checksumValid = a.length === b.length && crypto.timingSafeEqual(a, b);
    } else {
      // Backup was created before checksums were introduced — cannot verify
      checksumValid = null;
    }

    // ── Decompress ───────────────────────────────────────────────────────────
    let snapshot: BackupSnapshot;
    try {
      const jsonBuffer = await gunzip(compressedBuffer);
      snapshot = JSON.parse(jsonBuffer.toString('utf8')) as BackupSnapshot;
    } catch (err) {
      await this.log('BACKUP_VERIFIED', userId, userName, ip, record.id, record.backupName, 'failed',
        `Verify failed — decompression/parse error: ${err instanceof Error ? err.message : String(err)}`);
      return {
        valid: false,
        checksumValid,
        structureValid: false,
        tables: [],
        rowCounts: {},
        snapshotDate: null,
        details: 'Backup file is corrupted — decompression failed.',
      };
    }

    // ── Structure validation ─────────────────────────────────────────────────
    const structureValid = this.validateSnapshotStructure(snapshot);

    const tables    = structureValid ? Object.keys(snapshot.tables) : [];
    const rowCounts = structureValid
      ? Object.fromEntries(tables.map((t) => [t, (snapshot.tables[t] as unknown[]).length]))
      : {};

    const overallValid = (checksumValid !== false) && structureValid;

    const details = [
      checksumValid === true  ? '✓ Checksum matches' :
      checksumValid === false ? '✗ Checksum MISMATCH — file may be corrupted or tampered' :
                                '⚠ Checksum not available for this backup (created before checksum feature)',
      structureValid ? `✓ Structure valid (${tables.length} tables)` : '✗ Snapshot structure is invalid',
    ].join('; ');

    await this.log('BACKUP_VERIFIED', userId, userName, ip, record.id, record.backupName,
      overallValid ? 'success' : 'failed', details);

    return {
      valid:          overallValid,
      checksumValid,
      structureValid,
      tables,
      rowCounts,
      snapshotDate:   snapshot.createdAt ?? null,
      details,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Restore
  // ──────────────────────────────────────────────────────────────────────────

  // Cache for column type metadata used during restore
  private columnTypeCache: Map<string, Record<string, { data_type: string; udt_name: string }>> = new Map();

  async restoreBackup(
    id: string,
    userId: string,
    userName: string,
    ip: string,
  ): Promise<{ message: string; tablesRestored: number; preRestoreBackupId: string }> {

    const record = await this.findRecord(id);

    if (record.status !== 'success') {
      throw new InternalServerErrorException(
        `Cannot restore backup "${record.backupName}" — status is "${record.status}". Only successful backups can be restored.`,
      );
    }

    if (!record.s3Key) {
      throw new InternalServerErrorException(
        `Backup "${record.backupName}" has no S3 key. Cannot restore.`,
      );
    }

    this.logger.log(`Starting restore from backup "${record.backupName}" (S3: ${record.s3Key})`);

    // ── Log that restore has started (before any destructive operations) ──────
    await this.log('RESTORE_STARTED', userId, userName, ip, record.id, record.backupName, 'info',
      `Restore initiated for backup "${record.backupName}" created at ${record.createdAt.toISOString()}`);

    try {
      // ── STEP 1: Create a pre-restore safety backup ─────────────────────────
      // Before touching the current database, we take a snapshot of it.
      // If the admin restores the wrong backup, this safety copy lets them undo it.
      this.logger.log('Creating pre-restore safety backup of current data…');
      let preRestoreRecord: BackupRecord;
      try {
        preRestoreRecord = await this.createBackup(
          { notes: `Pre-restore safety backup — taken automatically before restoring "${record.backupName}"` },
          'pre-restore',
          userId,
          userName,
          ip,
        );
        this.logger.log(`Pre-restore backup created: ${preRestoreRecord.backupName} (${preRestoreRecord.id})`);
      } catch (preRestoreErr) {
        const msg = preRestoreErr instanceof Error ? preRestoreErr.message : String(preRestoreErr);
        await this.log('RESTORE_FAILED', userId, userName, ip, record.id, record.backupName, 'failed',
          `Restore aborted — could not create pre-restore safety backup: ${msg}`);
        throw new InternalServerErrorException(
          `Restore aborted: could not create a safety backup of the current database. Reason: ${msg}`,
        );
      }

      // ── STEP 2: Download backup from S3 ───────────────────────────────────
      const compressedBuffer = await this.s3StorageService.downloadBackup(record.s3Key);

      // ── STEP 3: SHA-256 integrity verification ────────────────────────────
      if (record.checksum) {
        const computedChecksum = crypto
          .createHash('sha256')
          .update(compressedBuffer)
          .digest('hex');

        const a = Buffer.from(computedChecksum,  'utf8');
        const b = Buffer.from(record.checksum,   'utf8');
        const checksumOk = a.length === b.length && crypto.timingSafeEqual(a, b);

        if (!checksumOk) {
          await this.log('RESTORE_FAILED', userId, userName, ip, record.id, record.backupName, 'failed',
            `Checksum mismatch — computed: ${computedChecksum.slice(0, 8)}..., stored: ${record.checksum.slice(0, 8)}...`);
          throw new InternalServerErrorException(
            'Restore ABORTED: the downloaded backup file does not match its stored SHA-256 checksum. ' +
            'The file may be corrupted or tampered with. Use the Verify feature to inspect this backup.',
          );
        }
        this.logger.log(`Checksum verified ✓ (SHA-256: ${computedChecksum.slice(0, 8)}…)`);
      } else {
        // Backup was created before checksums were introduced — proceed with a warning
        this.logger.warn(`Backup "${record.backupName}" has no stored checksum — skipping integrity check.`);
      }

      // ── STEP 4: Decompress ────────────────────────────────────────────────
      const jsonBuffer = await gunzip(compressedBuffer);
      const snapshot   = JSON.parse(jsonBuffer.toString('utf8')) as BackupSnapshot;

      // ── STEP 5: Backup format validation ─────────────────────────────────
      if (!this.validateSnapshotStructure(snapshot)) {
        await this.log('RESTORE_FAILED', userId, userName, ip, record.id, record.backupName, 'failed',
          'Restore aborted — backup JSON structure is invalid (missing version, createdAt, or tables field)');
        throw new InternalServerErrorException(
          'Restore ABORTED: the backup file does not have a valid ECMS snapshot structure. ' +
          'It may be from an incompatible version or created by a different system.',
        );
      }

      // ── STEP 6: Determine which tables exist in current schema ────────────
      const PROTECTED = new Set(['backup_records', 'backup_settings', 'backup_activity_logs']);
      const tableNames = Object.keys(snapshot.tables).filter((t) => !PROTECTED.has(t));

      const existingTables: string[] = [];
      for (const t of tableNames) {
        const res = await this.dataSource.query<{ exists: boolean }[]>(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = $1
           ) AS "exists"`,
          [t],
        );
        if (res[0]?.exists) existingTables.push(t);
        else this.logger.warn(`Table "${t}" not found in current schema — skipping`);
      }

      // Build a cache of column type metadata for all tables we will restore
      if (existingTables.length > 0) {
        const cols = await this.dataSource.query<{
          table_name: string;
          column_name: string;
          data_type: string;
          udt_name: string;
        }[]>(`
          SELECT table_name, column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ANY($1)
        `, [existingTables]);

        for (const r of cols) {
          const m = this.columnTypeCache.get(r.table_name) ?? {};
          m[r.column_name] = { data_type: r.data_type, udt_name: r.udt_name };
          this.columnTypeCache.set(r.table_name, m);
        }
      }

      // Helper: safely truncate value for logging
      const trunc = (v: unknown, n = 200) => {
        try {
          const s = typeof v === 'string' ? v : JSON.stringify(v);
          return s.length > n ? s.slice(0, n) + '…' : s;
        } catch {
          return String(v).slice(0, n) + '…';
        }
      };

      // Helper: normalize a single value according to the cached PG type

      // ── STEP 7: Transactional restore using manual QueryRunner so session
      //             cleanup can be performed safely even if the transaction
      //             is aborted. This ensures the original error is preserved.
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let originalError: any = null;

      try {
        // Acquire advisory lock
        await queryRunner.query('SELECT pg_advisory_xact_lock($1)', [RESTORE_ADVISORY_LOCK_ID]);
        this.logger.log(`Advisory lock acquired (id: ${RESTORE_ADVISORY_LOCK_ID})`);

        // Truncate
        if (existingTables.length > 0) {
          const tableList = existingTables.map((t) => `"${t}"`).join(', ');
          await queryRunner.query(`TRUNCATE TABLE ${tableList} CASCADE`);
        }

        // Disable FK triggers
        await queryRunner.query('SET session_replication_role = replica');

        // Re-insert rows
        for (const tableName of existingTables) {
          const rows = snapshot.tables[tableName] as Record<string, unknown>[];
          if (!rows || rows.length === 0) continue;

          const columns = Object.keys(rows[0]);
          const colList = columns.map((c) => `"${c}"`).join(', ');
          const CHUNK   = 500;

          for (let i = 0; i < rows.length; i += CHUNK) {
            const chunk  = rows.slice(i, i + CHUNK);
            const values: unknown[] = [];
            const placeholders = chunk.map((row, ri) => {
              const rowPlaceholders = columns.map((col, ci) => {
                const raw = row[col] ?? null;
                const norm = this.normalizeRestoreValue(tableName, col, raw);
                values.push(norm);
                return `$${ri * columns.length + ci + 1}`;
              });
              return `(${rowPlaceholders.join(', ')})`;
            });

            await queryRunner.query(
              `INSERT INTO "${tableName}" (${colList}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
              values,
            );
          }
        }

        // Reset sequences
        await this.resetSequences(queryRunner.manager, existingTables);

        // Commit transaction
        await queryRunner.commitTransaction();

      } catch (err) {
        originalError = err;
        try {
          await queryRunner.rollbackTransaction();
        } catch (rbErr) {
          this.logger.error('Rollback failed during restore cleanup', rbErr as any);
        }
        // rethrow after cleanup so outer catch preserves the original error
        throw err;
      } finally {
        // Always ensure session_replication_role is reset on the same session.
        // Because we've committed or rolled back above, it's safe to run this.
        try {
          await queryRunner.query('SET session_replication_role = DEFAULT');
        } catch (setErr) {
          this.logger.error('Failed to reset session_replication_role in restore cleanup', setErr as any);
        }
        await queryRunner.release();
      }

      // ── STEP 8: Audit log — success ───────────────────────────────────────
      await this.log(
        'RESTORE_COMPLETED', userId, userName, ip,
        record.id, record.backupName, 'success',
        `Database restored — ${existingTables.length} tables replaced. ` +
        `Pre-restore backup: ${preRestoreRecord!.backupName}. ` +
        `Snapshot date: ${snapshot.createdAt}`,
      );

      this.logger.log(`Restore complete — ${existingTables.length} tables restored from "${record.backupName}"`);

      return {
        message:            `Database successfully restored from backup "${record.backupName}"`,
        tablesRestored:     existingTables.length,
        preRestoreBackupId: preRestoreRecord!.id,
      };

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown restore error';
      this.logger.error(`Restore failed for backup ${id}`, err);

      // Only log RESTORE_FAILED if we didn't already log it above
      if (!errMsg.startsWith('Restore aborted') && !errMsg.startsWith('Restore ABORTED')) {
        await this.log(
          'RESTORE_FAILED', userId, userName, ip,
          record.id, record.backupName, 'failed',
          `Restore failed: ${errMsg}`,
        );
      }

      throw new InternalServerErrorException(`Restore failed: ${errMsg}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Activity Logs
  // ──────────────────────────────────────────────────────────────────────────

  async getActivityLogs(page = 1, limit = 50) {
    const [logs, total] = await this.logRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip:  (page - 1) * limit,
      take:  limit,
    });
    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Scheduler
  // ──────────────────────────────────────────────────────────────────────────

  async rescheduleAuto(): Promise<void> {
    // Cancel any existing scheduled timeout
    if (this.schedulerTimeout) {
      clearTimeout(this.schedulerTimeout);
      this.schedulerTimeout = null;
    }

    const settings = await this.getSettings();
    if (!settings.autoBackupEnabled) return;

    const nextRunIso = this.computeNextRun(settings.frequency, settings.backupTime);
    const nextRunMs  = new Date(nextRunIso).getTime();
    const delayMs    = Math.max(1000, nextRunMs - Date.now());

    // ── Fix: Node.js setTimeout uses a 32-bit signed integer for delay (ms).
    //    Maximum safe value = 2^31 - 1 = 2,147,483,647 ms ≈ 24.8 days.
    //    Monthly backups require ~30 days (2,592,000,000 ms) which OVERFLOWS,
    //    causing the timeout to fire immediately.
    //
    //    Solution: if the delay exceeds the safe limit, we set a shorter
    //    intermediate timeout and reschedule again at that point.  If we
    //    haven't reached the target time yet we simply reschedule again
    //    without running the backup.
    const MAX_SAFE_TIMEOUT_MS = 2_147_483_647;

    if (delayMs > MAX_SAFE_TIMEOUT_MS) {
      // Schedule an intermediate wake-up to re-check (use a safe chunk)
      const chunkMs = Math.min(delayMs, MAX_SAFE_TIMEOUT_MS);
      this.logger.log(
        `Auto-backup scheduled at ${nextRunIso} (Asia/Colombo) — ` +
        `delay ${Math.round(delayMs / 86_400_000)}d exceeds setTimeout limit; ` +
        `intermediate wake-up in ${Math.round(chunkMs / 3_600_000)}h`,
      );
      this.schedulerTimeout = setTimeout(() => {
        void this.rescheduleAuto();
      }, chunkMs);
      return;
    }

    this.logger.log(
      `Auto-backup scheduled in ${Math.round(delayMs / 60000)} minute(s) at ${nextRunIso} (Asia/Colombo)`,
    );

    this.schedulerTimeout = setTimeout(async () => {
      // Double-check: in case the timer fired slightly early (clock skew),
      // verify we are actually at or past the scheduled time.
      if (Date.now() < nextRunMs - 5_000) {
        this.logger.warn('Scheduler woke up early — rescheduling');
        void this.rescheduleAuto();
        return;
      }

      this.logger.log('Running scheduled auto backup…');
      await this.log('SCHEDULER_TRIGGERED', 'system', 'Scheduler', '127.0.0.1', null, null, 'info',
        `Scheduled ${settings.frequency} backup triggered at ${new Date().toISOString()}`);

      try {
        await this.createBackup(
          { notes: 'Automatic scheduled backup' },
          'scheduled',
          'system',
          'Scheduler',
          '127.0.0.1',
        );
      } catch (err) {
        this.logger.error('Scheduled backup failed', err);
      }

      // Schedule the next run after this one completes
      void this.rescheduleAuto();
    }, delayMs);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private async findRecord(id: string): Promise<BackupRecord> {
    const record = await this.backupRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Backup record ${id} not found`);
    return record;
  }

  /**
   * Validates that a parsed JSON object is a well-formed ECMS backup snapshot.
   * Simple structural check — we do not validate individual row schemas.
   */
  private validateSnapshotStructure(obj: unknown): obj is BackupSnapshot {
    if (!obj || typeof obj !== 'object') return false;
    const s = obj as Record<string, unknown>;

    if (typeof s['version']   !== 'string') return false;
    if (typeof s['createdAt'] !== 'string') return false;
    if (typeof s['tables']    !== 'object' || Array.isArray(s['tables']) || !s['tables']) return false;

    // Every value in tables must be an array
    for (const val of Object.values(s['tables'] as object)) {
      if (!Array.isArray(val)) return false;
    }

    // Only version 1.0.0 is supported
    if (s['version'] !== '1.0.0') {
      this.logger.warn(`Unsupported backup version: ${String(s['version'])}`);
      return false;
    }

    return true;
  }

  /**
   * After a restore, PostgreSQL SERIAL/BIGSERIAL sequences still hold their
   * pre-restore values.  This method queries the database for all sequences
   * linked to columns in the restored tables and resets each one to MAX(col)+1.
   *
   * In this project most primary keys are UUIDs, so this is usually a no-op.
   * The code handles both integer sequences and UUID tables gracefully.
   */
  private async resetSequences(
    manager: EntityManager,
    tableNames: string[],
  ): Promise<void> {
    if (tableNames.length === 0) return;

    // Query PostgreSQL system catalog for sequences attached to the restored tables
    const sequences = await manager.query<{
      sequence_name: string;
      table_name:    string;
      column_name:   string;
    }[]>(`
      SELECT
        s.relname    AS sequence_name,
        t.relname    AS table_name,
        a.attname    AS column_name
      FROM pg_class       s
      JOIN pg_depend      d ON d.objid = s.oid
                            AND d.classid = 'pg_class'::regclass
                            AND d.refclassid = 'pg_class'::regclass
      JOIN pg_class       t ON t.oid = d.refobjid
      JOIN pg_attribute   a ON a.attrelid = t.oid
                            AND a.attnum  = d.refobjsubid
      JOIN pg_namespace   n ON n.oid = t.relnamespace
      WHERE s.relkind = 'S'
        AND n.nspname = 'public'
        AND t.relname = ANY($1)
    `, [tableNames]);

    if (sequences.length === 0) {
      this.logger.log('No integer sequences found for restored tables (all PKs are UUIDs).');
      return;
    }

    for (const seq of sequences) {
      try {
        const result = await manager.query<{ max: string | null }[]>(
          `SELECT MAX("${seq.column_name}") AS max FROM "${seq.table_name}"`,
        );
        const maxVal = result[0]?.max;
        if (maxVal !== null && maxVal !== undefined) {
          await manager.query(`SELECT setval($1, $2, false)`, [seq.sequence_name, Number(maxVal) + 1]);
          this.logger.log(`Sequence "${seq.sequence_name}" reset to ${Number(maxVal) + 1}`);
        }
      } catch (err) {
        this.logger.warn(`Could not reset sequence "${seq.sequence_name}": ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  /**
   * Normalize a restore value for a specific table.column using cached
   * PostgreSQL type metadata gathered during restore preparation.
   *
   * Rules:
   * - For json/jsonb columns: objects/arrays -> JSON.stringify, strings that
   *   are already valid JSON are left alone, non-JSON strings are stringified
   *   into valid JSON string literals. Null stays null.
   * - For json[] (udt_name = _json/_jsonb): each element is normalized
   *   similarly and the resulting JS array is passed as the parameter.
   *
   * This helper relies on columnTypeCache being populated prior to restore.
   */
  private normalizeRestoreValue(tableName: string, columnName: string, value: unknown): unknown {
    const map = this.columnTypeCache.get(tableName) ?? {};
    const meta = map[columnName];

    const trunc = (v: unknown, n = 200) => {
      try {
        const s = typeof v === 'string' ? v : JSON.stringify(v);
        return s.length > n ? s.slice(0, n) + '…' : s;
      } catch {
        return String(v).slice(0, n) + '…';
      }
    };

    if (value === null || value === undefined) return null;

    // If we don't know the PG type, return value as-is
    if (!meta) return value;

    const pgType = (meta.data_type || '').toLowerCase();
    const udt = (meta.udt_name || '').toLowerCase();

    // Handle json / jsonb
    if (pgType === 'json' || pgType === 'jsonb' || udt === 'json' || udt === 'jsonb') {
      try {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        if (typeof value === 'string') {
          // If already valid JSON, leave as-is to avoid double-encoding
          try {
            JSON.parse(value);
            return value;
          } catch (e) {
            // Not valid JSON string — convert into JSON string literal
            return JSON.stringify(value);
          }
        }
        // Other primitives (number, boolean) stringify safely
        return JSON.stringify(value as any);
      } catch (convErr) {
        this.logger.error(`JSON normalization failed for ${tableName}.${columnName}`, convErr as any);
        this.logger.error(`PG type=${meta.data_type}/${meta.udt_name} typeof=${typeof value} isArray=${Array.isArray(value)} value=${trunc(value)}`);
        throw convErr;
      }
    }

    // Handle array types (udt_name starting with underscore, e.g. _json, _int4)
    if (udt.startsWith('_')) {
      const elemType = udt.slice(1);
      // If it's an array of json/jsonb — normalize each element
      if (elemType === 'json' || elemType === 'jsonb') {
        if (!Array.isArray(value)) {
          // If source is a single object, wrap it in array
          const single = value as any;
          try {
            if (typeof single === 'object') return [JSON.stringify(single)];
            if (typeof single === 'string') {
              try { JSON.parse(single); return [single]; } catch { return [JSON.stringify(single)]; }
            }
            return [JSON.stringify(single)];
          } catch (e) {
            this.logger.error(`JSON[] normalization failed for ${tableName}.${columnName}`, e as any);
            this.logger.error(`PG type=${meta.data_type}/${meta.udt_name} typeof=${typeof value} isArray=${Array.isArray(value)} value=${trunc(value)}`);
            throw e;
          }
        }
        try {
          return (value as unknown[]).map((el) => {
            if (el === null || el === undefined) return null;
            if (typeof el === 'object') return JSON.stringify(el);
            if (typeof el === 'string') {
              try { JSON.parse(el); return el; } catch { return JSON.stringify(el); }
            }
            return JSON.stringify(el);
          });
        } catch (e) {
          this.logger.error(`JSON[] normalization failed for ${tableName}.${columnName}`, e as any);
          this.logger.error(`PG type=${meta.data_type}/${meta.udt_name} typeof=${typeof value} isArray=${Array.isArray(value)} value=${trunc(value)}`);
          throw e;
        }
      }
      // For non-json arrays, return as-is
      return value;
    }

    // Default: return original value
    return value;
  }

  /**
   * On startup, any backup that is still at status='running' after more than
   * STUCK_BACKUP_TIMEOUT_MINUTES has most likely been interrupted by a server
   * crash.  We mark them as failed so the UI does not show them as in-progress
   * indefinitely.
   */
  private async cleanStuckBackups(): Promise<void> {
    const cutoff = new Date(Date.now() - STUCK_BACKUP_TIMEOUT_MINUTES * 60 * 1000);
    const result = await this.backupRepo.update(
      { status: 'running', createdAt: LessThan(cutoff) },
      {
        status:       'failed',
        errorMessage: 'Backup interrupted because the application stopped unexpectedly.',
        completedAt:  new Date(),
      },
    );
    if ((result.affected ?? 0) > 0) {
      this.logger.warn(`Marked ${result.affected} stuck backup(s) as failed on startup.`);
    }
  }

  /**
   * Retention policy — deletes the oldest manual + scheduled backups once
   * the count exceeds maxToKeep.
   *
   * pre-restore backups are intentionally excluded: they are safety snapshots
   * created automatically before each restore and must never be auto-deleted.
   */
  private async purgeOldBackups(maxToKeep: number): Promise<void> {
    const all = await this.backupRepo.find({
      // Only count manual and scheduled — pre-restore are never purged
      where: [{ backupType: 'manual' }, { backupType: 'scheduled' }],
      order: { createdAt: 'DESC' },
    });
    if (all.length <= maxToKeep) return;

    const toDelete = all.slice(maxToKeep);
    let purged = 0;
    for (const r of toDelete) {
      if (r.s3Key) {
        try {
          await this.s3StorageService.deleteBackup(r.s3Key);
        } catch (err) {
          this.logger.error(`Failed to purge S3 object ${r.s3Key}: ${err instanceof Error ? err.message : err}`);
          continue; // keep the DB record so the admin can see the failure
        }
      }
      await this.backupRepo.remove(r);
      purged++;
    }
    this.logger.log(`Purged ${purged} old backup(s)`);
  }

  private async log(
    action:     ActivityAction,
    userId:     string,
    userName:   string,
    ip:         string,
    backupId:   string | null | undefined,
    backupName: string | null | undefined,
    status:     'success' | 'failed' | 'info',
    details:    string,
  ): Promise<void> {
    const entry = this.logRepo.create({
      action,
      userId:     userId     ?? undefined,
      userName:   userName   ?? undefined,
      ipAddress:  ip         ?? undefined,
      backupId:   backupId   ?? undefined,
      backupName: backupName ?? undefined,
      status,
      details,
    });
    await this.logRepo.save(entry).catch(() => {});
  }

  private getLocalTimestampStr(d: Date = new Date()): string {
    const colomboMs = d.getTime() + (5 * 60 + 30) * 60 * 1000;
    const cd  = new Date(colomboMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${cd.getUTCFullYear()}-${pad(cd.getUTCMonth() + 1)}-${pad(cd.getUTCDate())}_${pad(cd.getUTCHours())}-${pad(cd.getUTCMinutes())}-${pad(cd.getUTCSeconds())}`;
  }

  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT version()');
      return (result[0]?.version as string)?.split(' ').slice(0, 2).join(' ') ?? 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k     = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i     = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private computeNextRun(frequency: string, backupTime: string): string {
    const TZ = 'Asia/Colombo';
    const [targetH, targetM] = (backupTime || '02:00').split(':').map(Number);

    const now = new Date();

    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const parts  = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    const year   = Number(parts.year);
    const month  = Number(parts.month) - 1;
    const day    = Number(parts.day);
    const hour   = Number(parts.hour);
    const minute = Number(parts.minute);
    const second = Number(parts.second);

    const colomboNowMs = Date.UTC(year, month, day, hour, minute, second);
    const utcOffsetMs  = now.getTime() - colomboNowMs;

    let nextColomboMs: number;

    if (frequency === 'hourly') {
      nextColomboMs = Date.UTC(year, month, day, hour, targetM, 0);
      if (nextColomboMs <= colomboNowMs) nextColomboMs += 3_600_000;
    } else if (frequency === '6hours') {
      const baseMs     = Date.UTC(year, month, day, targetH, targetM, 0);
      const intervalMs = 6 * 3_600_000;
      const diffMs     = colomboNowMs - baseMs;
      const intervals  = Math.floor(diffMs / intervalMs);
      nextColomboMs    = baseMs + intervals * intervalMs;
      if (nextColomboMs <= colomboNowMs) nextColomboMs += intervalMs;
    } else if (frequency === 'weekly') {
      nextColomboMs = Date.UTC(year, month, day, targetH, targetM, 0);
      if (nextColomboMs <= colomboNowMs) nextColomboMs += 7 * 86_400_000;
    } else if (frequency === 'monthly') {
      // Compute the same time next month using the Date constructor
      // (handles varying month lengths correctly)
      const candidate = new Date(Date.UTC(year, month, day, targetH, targetM, 0));
      if (candidate.getTime() <= colomboNowMs) {
        // Roll to same day next month
        candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      }
      nextColomboMs = candidate.getTime();
    } else {
      // default: daily
      nextColomboMs = Date.UTC(year, month, day, targetH, targetM, 0);
      if (nextColomboMs <= colomboNowMs) nextColomboMs += 86_400_000;
    }

    return new Date(nextColomboMs + utcOffsetMs).toISOString();
  }

  private computeMonthlyBreakdown(records: BackupRecord[]) {
    const months: { label: string; count: number; success: number; failed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label    = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const inMonth  = records.filter((r) => {
        const cd = new Date(r.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });
      months.push({
        label,
        count:   inMonth.length,
        success: inMonth.filter((r) => r.status === 'success').length,
        failed:  inMonth.filter((r) => r.status === 'failed').length,
      });
    }
    return months;
  }
}
