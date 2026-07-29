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
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

// Exposes all backup management operations behind admin-only role guards
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
      userId: user?.sub ?? user?.id ?? 'unknown',
      userName: user?.fullName ?? user?.email ?? 'Admin',
    };
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    return this.backupService.getStats();
  }

  // ── List Backups ───────────────────────────────────────────────────────────

  @Get('list')
  async listBackups(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search = '',
  ) {
    return this.backupService.listBackups(page, limit, search);
  }

  // ── Create Manual Backup ───────────────────────────────────────────────────

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createBackup(@Body() dto: CreateBackupDto, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.createBackup(dto, 'manual', userId, userName, ip);
  }

  // ── Download ───────────────────────────────────────────────────────────────

  @Get(':id/download')
  async downloadBackup(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    const filePath = await this.backupService.getBackupFilePath(id, userId, userName, ip);
    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  @Delete(':id')
  async deleteBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.deleteBackup(id, userId, userName, ip);
  }

  // ── Verify Integrity ───────────────────────────────────────────────────────

  @Post(':id/verify')
  async verifyBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.verifyBackup(id, userId, userName, ip);
  }

  // ── Restore ────────────────────────────────────────────────────────────────

  @Post(':id/restore')
  async restoreBackup(@Param('id') id: string, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.restoreBackup(id, userId, userName, ip);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  @Get('settings')
  async getSettings() {
    return this.backupService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() dto: UpdateBackupSettingsDto, @Request() req: any) {
    const { userId, userName } = this.getUserInfo(req);
    const ip = this.getIp(req);
    return this.backupService.updateSettings(dto, userId, userName, ip);
  }

  // ── Activity Logs ──────────────────────────────────────────────────────────

  @Get('activity-logs')
  async getActivityLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.backupService.getActivityLogs(page, limit);
  }
}
