import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';

import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

// ─────────────────────────────────────────────────────────────────────────────
// Permission model:
//
//   ADMIN       → read-only operations + create backup
//   SUPER_ADMIN → everything, including destructive operations
//                 (restore, delete, change settings)
//
// Class-level @Roles sets the default; method-level @Roles narrows it further.
// ─────────────────────────────────────────────────────────────────────────────
@Controller('backup')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  private getIp(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket?.remoteAddress ?? '0.0.0.0';
  }

  private getUserInfo(req: any) {
    const user = req.user;
    return {
      userId:   user?.sub ?? user?.id ?? 'unknown',
      userName: user?.fullName ?? user?.email ?? 'Admin',
    };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  // Available to both ADMIN and SUPER_ADMIN.

  @Get('stats')
  async getStats() {
    return this.backupService.getStats();
  }

  // ── List Backups ──────────────────────────────────────────────────────────

  @Get('list')
  async listBackups(
    @Query('page',   new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit',  new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search = '',
  ) {
    return this.backupService.listBackups(page, limit, search);
  }

  // ── Activity Logs ─────────────────────────────────────────────────────────

  @Get('activity-logs')
  async getActivityLogs(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.backupService.getActivityLogs(page, limit);
  }

  // ── Settings — read ───────────────────────────────────────────────────────

  @Get('settings')
  async getSettings() {
    return this.backupService.getSettings();
  }

  // ── Create Manual Backup ──────────────────────────────────────────────────
  // ADMIN may create backups; only SUPER_ADMIN may restore or delete.

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createBackup(@Body() dto: CreateBackupDto, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.createBackup(dto, 'manual', userId, userName, ip);
  }

  // ── Verify Backup ─────────────────────────────────────────────────────────
  // Non-destructive integrity check — both roles may verify.
  // Downloads from S3, checks SHA-256, decompresses, validates structure.
  // The database is never modified by this endpoint.

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.verifyBackup(id, userId, userName, ip);
  }

  // ── Restore ───────────────────────────────────────────────────────────────
  // SUPER_ADMIN only — destructive operation that replaces the entire database.

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  async restoreBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.restoreBackup(id, userId, userName, ip);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  // SUPER_ADMIN only — permanently removes backup from S3 and DB.

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.deleteBackup(id, userId, userName, ip);
  }

  // ── Settings — write ──────────────────────────────────────────────────────
  // SUPER_ADMIN only — changing scheduler or retention settings is destructive.

  @Put('settings')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSettings(@Body() dto: UpdateBackupSettingsDto, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.updateSettings(dto, userId, userName, ip);
  }
}
