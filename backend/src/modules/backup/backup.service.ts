import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

import { BackupRecord, BackupStatus } from './entities/backup-record.entity';
import { BackupSettings } from './entities/backup-settings.entity';
import { BackupActivityLog, ActivityAction } from './entities/backup-activity-log.entity';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { MailService } from '../mail/mail.service';
import { S3StorageService } from './s3-storage.service';

const gzip   = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Orchestrates all backup and restore operations, scheduler logic, and retention enforcement.
// Storage backend is chosen per-backup based on BackupSettings.storageLocation:
//   'S3'    → upload/download/delete via S3StorageService (AWS SDK v3)
//   'LOCAL' → legacy fs.* file-system operations (./backups directory)
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private schedulerInterval: NodeJS.Timeout | null = null;
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
  ) {
    // Ensure local backup directory exists on startup (used for LOCAL-type backups)
    this.ensureBackupDir();
    // Bootstrap singleton settings row if missing
    this.initSettings().catch((err) =>
      this.logger.error('Failed to init backup settings', err),
    );
    // Start scheduler
    this.rescheduleAuto().catch(() => {});
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
    type: 'manual' | 'scheduled' | 'pre-restore',
    userId: string,
    userName: string,
    ip: string,
  ): Promise<BackupRecord> {
    const settings = await this.getSettings();
    const timestamp = new Date();
    const localTimeStr = this.getLocalTimestampStr(timestamp);
    const safeName = `backup_${type}_${localTimeStr}`;

    const record = this.backupRepo.create({
      backupName: safeName,
      backupType: type,
      status: 'running',
      createdByUserId: userId,
      createdByName: userName,
      notes: dto?.notes ?? undefined,
      backupVersion: '1.0.0',
      createdAt: new Date(),
    });
    await this.backupRepo.save(record);

    try {
      // ── Gather all entity table data ──────────────────────────────────────
      const entityMetadatas = this.dataSource.entityMetadatas;
      const snapshot: Record<string, unknown[]> = {};

      for (const meta of entityMetadatas) {
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

      const snapshotJson = JSON.stringify({
        version:   '1.0.0',
        createdAt: timestamp.toISOString(),
        createdBy: userName,
        tables:    snapshot,
      });

      // ── Compress / serialise ──────────────────────────────────────────────
      let fileBuffer: Buffer;
      let fileExt: string;

      if (settings.compressionEnabled) {
        fileBuffer = await gzip(Buffer.from(snapshotJson, 'utf8'));
        fileExt = '.json.gz';
      } else {
        fileBuffer = Buffer.from(snapshotJson, 'utf8');
        fileExt = '.json';
      }

      const fileName = `${safeName}${fileExt}`;

      // ── Compute checksum (always, regardless of storage backend) ──────────
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const dbVersion = await this.getDatabaseVersion();

      // ── Storage: S3 or LOCAL ──────────────────────────────────────────────
      const useS3 = settings.storageLocation === 'S3';

      if (useS3) {
        // ── Upload to AWS S3 ────────────────────────────────────────────────
        const uploadResult = await this.s3StorageService.uploadBackup(fileBuffer, fileName);

        record.storageType    = 'S3';
        record.s3Key          = uploadResult.key;
        record.s3Url          = uploadResult.location;
        record.filePath       = null!; // not stored locally
        record.fileSizeBytes  = uploadResult.size;
      } else {
        // ── Write to local disk (legacy / LOCAL mode) ───────────────────────
        const filePath = path.join(this.getBackupDir(), fileName);
        fs.writeFileSync(filePath, fileBuffer);

        record.storageType   = 'LOCAL';
        record.filePath      = filePath;
        record.fileSizeBytes = fileBuffer.byteLength;
      }

      record.status          = 'success';
      record.checksum        = checksum;
      record.databaseVersion = dbVersion;
      record.completedAt     = new Date();
      await this.backupRepo.save(record);

      await this.log(
        'BACKUP_CREATED', userId, userName, ip, record.id, safeName, 'success',
        `Backup created (${this.formatBytes(fileBuffer.byteLength)}) — storage: ${record.storageType}`,
      );

      // ── Email notification ─────────────────────────────────────────────────
      if (settings.emailNotification?.trim()) {
        this.mailService.sendBackupNotification(settings.emailNotification, {
          backupName:    record.backupName,
          status:        record.status,
          fileSizeBytes: Number(record.fileSizeBytes),
          errorMessage:  record.errorMessage ?? undefined,
          notes:         record.notes ?? undefined,
          completedAt:   record.completedAt ?? undefined,
        }).catch((err) =>
          this.logger.error('Failed to send backup email notification', err),
        );
      }

      // ── Enforce retention policy ───────────────────────────────────────────
      await this.purgeOldBackups(settings.maxBackupsToKeep);

      return record;
    } catch (err) {
      this.logger.error('Backup failed', err);
      record.status       = 'failed';
      record.errorMessage = err instanceof Error ? err.message : 'Unknown error';
      record.completedAt  = new Date();
      await this.backupRepo.save(record);
      await this.log('BACKUP_CREATED', userId, userName, ip, record.id, safeName, 'failed', record.errorMessage);

      if (settings.emailNotification?.trim()) {
        this.mailService.sendBackupNotification(settings.emailNotification, {
          backupName:   record.backupName,
          status:       record.status,
          errorMessage: record.errorMessage ?? undefined,
          notes:        record.notes ?? undefined,
          completedAt:  record.completedAt ?? undefined,
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
    const all    = await this.backupRepo.find({ order: { createdAt: 'DESC' } });
    const total  = all.length;
    const latest = all[0] ?? null;
    const success = all.filter((r) => r.status === 'success').length;
    const failed  = all.filter((r) => r.status === 'failed').length;

    const totalBytes = all.reduce((sum, r) => sum + Number(r.fileSizeBytes || 0), 0);

    const settings = await this.getSettings();
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
  // Download
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns { buffer, filename } regardless of storage type.
   * The controller is responsible for streaming the buffer to the HTTP response.
   */
  async getBackupFileBuffer(
    id: string,
    userId: string,
    userName: string,
    ip: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const record = await this.findRecord(id);
    const filename = path.basename(
      record.storageType === 'S3'
        ? (record.s3Key ?? record.backupName)
        : (record.filePath ?? record.backupName),
    );

    let buffer: Buffer;

    if (record.storageType === 'S3') {
      // ── Download from S3 ──────────────────────────────────────────────────
      if (!record.s3Key) {
        await this.log('BACKUP_DOWNLOADED', userId, userName, ip, id, record.backupName, 'failed', 'S3 key missing on record');
        throw new NotFoundException('Backup S3 key not found — record may be corrupt');
      }
      try {
        buffer = await this.s3StorageService.downloadBackup(record.s3Key);
      } catch (err) {
        await this.log('BACKUP_DOWNLOADED', userId, userName, ip, id, record.backupName, 'failed', err instanceof Error ? err.message : 'S3 download error');
        throw new InternalServerErrorException('Failed to download backup from S3: ' + (err instanceof Error ? err.message : 'Unknown'));
      }
    } else {
      // ── Read from local disk (LOCAL records) ──────────────────────────────
      if (!record.filePath || !fs.existsSync(record.filePath)) {
        await this.log('BACKUP_DOWNLOADED', userId, userName, ip, id, record.backupName, 'failed', 'File missing on disk');
        throw new NotFoundException('Backup file not found on disk');
      }
      buffer = fs.readFileSync(record.filePath);
    }

    await this.log('BACKUP_DOWNLOADED', userId, userName, ip, id, record.backupName, 'success', `Downloaded (${this.formatBytes(buffer.byteLength)})`);
    return { buffer, filename };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete
  // ──────────────────────────────────────────────────────────────────────────

  async deleteBackup(id: string, userId: string, userName: string, ip: string): Promise<{ message: string }> {
    const record = await this.findRecord(id);

    if (record.storageType === 'S3') {
      // ── Delete from S3 ────────────────────────────────────────────────────
      if (record.s3Key) {
        try {
          await this.s3StorageService.deleteBackup(record.s3Key);
        } catch (err) {
          // Log the S3 error but continue removing the DB record
          this.logger.error(`S3 delete failed for backup ${id}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } else {
      // ── Delete local file ─────────────────────────────────────────────────
      if (record.filePath && fs.existsSync(record.filePath)) {
        fs.unlinkSync(record.filePath);
      }
    }

    await this.backupRepo.remove(record);
    await this.log('BACKUP_DELETED', userId, userName, ip, id, record.backupName, 'success', `Backup deleted (storage: ${record.storageType})`);

    return { message: `Backup "${record.backupName}" deleted successfully` };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Verify Integrity
  // ──────────────────────────────────────────────────────────────────────────

  async verifyBackup(id: string, userId: string, userName: string, ip: string) {
    const record = await this.findRecord(id);
    let fileBuffer: Buffer;

    if (record.storageType === 'S3') {
      // ── Download from S3 for verification ────────────────────────────────
      if (!record.s3Key) {
        await this.log('BACKUP_VERIFIED', userId, userName, ip, id, record.backupName, 'failed', 'S3 key missing');
        return { valid: false, reason: 'Backup S3 key not found on record' };
      }

      const exists = await this.s3StorageService.verifyBackupExists(record.s3Key);
      if (!exists) {
        await this.log('BACKUP_VERIFIED', userId, userName, ip, id, record.backupName, 'failed', 'Object not found in S3');
        return { valid: false, reason: 'Backup object not found in S3 bucket' };
      }

      try {
        fileBuffer = await this.s3StorageService.downloadBackup(record.s3Key);
      } catch (err) {
        await this.log('BACKUP_VERIFIED', userId, userName, ip, id, record.backupName, 'failed', 'S3 download error during verify');
        return { valid: false, reason: `S3 download error: ${err instanceof Error ? err.message : 'Unknown'}` };
      }
    } else {
      // ── Read local file for verification ─────────────────────────────────
      if (!record.filePath || !fs.existsSync(record.filePath)) {
        await this.log('BACKUP_VERIFIED', userId, userName, ip, id, record.backupName, 'failed', 'File missing on disk');
        return { valid: false, reason: 'Backup file not found on disk' };
      }
      fileBuffer = fs.readFileSync(record.filePath);
    }

    const computed = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const valid    = computed === record.checksum;

    await this.log(
      'BACKUP_VERIFIED',
      userId, userName, ip, id, record.backupName,
      valid ? 'success' : 'failed',
      valid
        ? `Checksum verified OK (storage: ${record.storageType})`
        : `Checksum mismatch — expected ${record.checksum}, got ${computed}`,
    );

    return {
      valid,
      storageType:     record.storageType,
      storedChecksum:  record.checksum,
      computedChecksum: computed,
      reason: valid ? 'Integrity check passed' : 'Checksum mismatch — file may be corrupted',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Restore
  // ──────────────────────────────────────────────────────────────────────────

  async restoreBackup(
    id: string,
    userId: string,
    userName: string,
    ip: string,
  ) {
    await this.log('RESTORE_STARTED', userId, userName, ip, id, null, 'info', 'Restore initiated — creating safety backup');

    // Step 1: Create a safety backup before restore (pre-restore type)
    try {
      await this.createBackup({ notes: 'Auto safety backup before restore' }, 'pre-restore', userId, userName, ip);
    } catch (err) {
      this.logger.warn('Safety backup failed, proceeding anyway', err);
    }

    const record = await this.findRecord(id);
    let fileBuffer: Buffer;

    // Step 2: Retrieve the backup file (S3 or local)
    if (record.storageType === 'S3') {
      if (!record.s3Key) {
        await this.log('RESTORE_FAILED', userId, userName, ip, id, record.backupName, 'failed', 'S3 key missing on record');
        throw new NotFoundException('Backup S3 key not found — record may be corrupt');
      }
      try {
        fileBuffer = await this.s3StorageService.downloadBackup(record.s3Key);
        this.logger.log(`Restore: downloaded ${fileBuffer.byteLength} bytes from S3 (${record.s3Key})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'S3 download error';
        await this.log('RESTORE_FAILED', userId, userName, ip, id, record.backupName, 'failed', msg);
        throw new InternalServerErrorException('Restore failed — could not download from S3: ' + msg);
      }
    } else {
      // LOCAL backup
      if (!record.filePath || !fs.existsSync(record.filePath)) {
        await this.log('RESTORE_FAILED', userId, userName, ip, id, record.backupName, 'failed', 'File not found on disk');
        throw new NotFoundException('Backup file not found on disk');
      }
      fileBuffer = fs.readFileSync(record.filePath);
    }

    try {
      // Step 3: Decompress if needed
      let jsonStr: string;
      if (
        (record.s3Key && record.s3Key.endsWith('.gz')) ||
        (record.filePath && record.filePath.endsWith('.gz'))
      ) {
        const decompressed = await gunzip(fileBuffer);
        jsonStr = decompressed.toString('utf8');
      } else {
        jsonStr = fileBuffer.toString('utf8');
      }

      // Step 4: Parse JSON snapshot
      const snapshot = JSON.parse(jsonStr);
      const tables: Record<string, unknown[]> = snapshot.tables ?? {};

      // Step 5: Two-phase restore within a single transaction
      //
      // WHY TWO PHASES?
      // The old single-pass approach (TRUNCATE then INSERT per table) caused FK
      // violations because child tables (e.g. channeling_slots → doctors) were
      // inserted before their parent tables had data back.
      //
      // Phase A: Truncate ALL tables first (CASCADE removes FK-linked rows)
      // Phase B: Bypass FK trigger checks via session_replication_role=replica,
      //          then insert ALL tables — order no longer matters.
      //
      await this.dataSource.transaction(async (em) => {

        // ── Phase A: Truncate all tables ─────────────────────────────────────
        const truncatable: string[] = [];
        for (const [tableName, rows] of Object.entries(tables)) {
          if (!Array.isArray(rows)) continue;
          try {
            await em.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
            truncatable.push(tableName);
          } catch {
            // Table may not exist in this schema version — skip gracefully
            this.logger.warn(`Restore: could not truncate "${tableName}" — skipping`);
          }
        }
        this.logger.log(`Restore: truncated ${truncatable.length} table(s)`);

        // ── Phase B: Disable FK constraint checks for this transaction ────────
        // SET LOCAL makes the setting transaction-scoped — automatically reverts
        // when the transaction commits/rolls back.
        // session_replication_role=replica disables trigger-based FK enforcement,
        // which is safe here because the backup is a consistent snapshot.
        try {
          await em.query(`SET LOCAL session_replication_role = replica`);
          this.logger.log('Restore: FK constraint checks disabled (session_replication_role=replica)');
        } catch (fkErr) {
          // Some RDS configurations restrict this — log and continue anyway
          this.logger.warn('Restore: could not disable FK checks, restore may still fail on FK constraints', fkErr);
        }

        // ── Phase C: Insert all table data ───────────────────────────────────
        let insertedTables = 0;
        let insertedRows   = 0;

        for (const [tableName, rows] of Object.entries(tables)) {
          if (!Array.isArray(rows) || rows.length === 0) continue;
          if (!truncatable.includes(tableName)) continue; // skip tables that could not be truncated

          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize) as Record<string, unknown>[];
            if (batch.length === 0) continue;

            const cols   = Object.keys(batch[0]).map((c) => `"${c}"`).join(', ');
            const values = batch
              .map(
                (row) =>
                  '(' +
                  Object.values(row)
                    .map((v) =>
                      v === null
                        ? 'NULL'
                        : `'${String(v).replace(/'/g, "''")}'`,
                    )
                    .join(', ') +
                  ')',
              )
              .join(', ');

            await em.query(
              `INSERT INTO "${tableName}" (${cols}) VALUES ${values} ON CONFLICT DO NOTHING`,
            );
            insertedRows += batch.length;
          }
          insertedTables++;
        }

        // session_replication_role resets automatically at transaction end
        this.logger.log(`Restore: inserted data into ${insertedTables} table(s) (${insertedRows} row(s))`);
      });

      await this.log('RESTORE_COMPLETED', userId, userName, ip, id, record.backupName, 'success', `System restored from ${record.storageType} backup`);
      return { message: 'System restored successfully from backup: ' + record.backupName };
    } catch (err) {
      this.logger.error('Restore failed', err);
      await this.log('RESTORE_FAILED', userId, userName, ip, id, record.backupName, 'failed', err instanceof Error ? err.message : 'Unknown');
      throw new InternalServerErrorException('Restore failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    if (this.schedulerTimeout) {
      clearTimeout(this.schedulerTimeout);
      this.schedulerTimeout = null;
    }

    const settings = await this.getSettings();
    if (!settings.autoBackupEnabled) return;

    const nextRunIso = this.computeNextRun(settings.frequency, settings.backupTime);
    const delayMs    = Math.max(1000, new Date(nextRunIso).getTime() - Date.now());

    this.logger.log(`Auto-backup scheduled in ${Math.round(delayMs / 60000)} minute(s) at ${nextRunIso} (Colombo time) — storage: ${settings.storageLocation}`);

    this.schedulerTimeout = setTimeout(async () => {
      this.logger.log('Running scheduled auto backup…');
      try {
        await this.createBackup({ notes: 'Automatic scheduled backup' }, 'scheduled', 'system', 'Scheduler', '127.0.0.1');
      } catch (err) {
        this.logger.error('Scheduled backup failed', err);
      }
      this.rescheduleAuto();
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

  private async purgeOldBackups(maxToKeep: number): Promise<void> {
    // Only enforce retention on manual and scheduled backups;
    // pre-restore safety backups are never counted towards the limit
    const all = await this.backupRepo.find({
      where: [{ backupType: 'manual' }, { backupType: 'scheduled' }],
      order: { createdAt: 'DESC' },
    });
    if (all.length <= maxToKeep) return;

    const toDelete = all.slice(maxToKeep);
    for (const r of toDelete) {
      if (r.storageType === 'S3' && r.s3Key) {
        try {
          await this.s3StorageService.deleteBackup(r.s3Key);
        } catch (err) {
          this.logger.error(`Failed to purge S3 object ${r.s3Key}: ${err instanceof Error ? err.message : err}`);
        }
      } else if (r.filePath && fs.existsSync(r.filePath)) {
        try { fs.unlinkSync(r.filePath); } catch { /* ignore */ }
      }
      await this.backupRepo.remove(r);
    }
    this.logger.log(`Purged ${toDelete.length} old backup(s)`);
  }

  private async log(
    action: ActivityAction,
    userId: string,
    userName: string,
    ip: string,
    backupId: string | null | undefined,
    backupName: string | null | undefined,
    status: 'success' | 'failed' | 'info',
    details: string,
  ): Promise<void> {
    const entry = this.logRepo.create({
      action,
      userId:     userId    ?? undefined,
      userName:   userName  ?? undefined,
      ipAddress:  ip        ?? undefined,
      backupId:   backupId  ?? undefined,
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

  private getBackupDir(): string {
    return path.resolve(process.env.BACKUP_DIR || './backups');
  }

  private ensureBackupDir(): void {
    const dir = this.getBackupDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
    const parts        = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    const year         = Number(parts.year);
    const month        = Number(parts.month) - 1;
    const day          = Number(parts.day);
    const hour         = Number(parts.hour);
    const minute       = Number(parts.minute);
    const second       = Number(parts.second);

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
      nextColomboMs = Date.UTC(year, month, day, targetH, targetM, 0);
      if (nextColomboMs <= colomboNowMs) nextColomboMs += 30 * 86_400_000;
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
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const inMonth = records.filter((r) => {
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
