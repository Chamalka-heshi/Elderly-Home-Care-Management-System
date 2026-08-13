import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BackupRecord } from './entities/backup-record.entity';
import { BackupSettings } from './entities/backup-settings.entity';
import { BackupActivityLog } from './entities/backup-activity-log.entity';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { S3StorageService } from './s3-storage.service';
import { MailModule } from '../mail/mail.module';

// Self-contained module encapsulating all backup and restore functionality.
// S3StorageService is included as a provider so it can be injected into BackupService.
@Module({
  imports: [
    TypeOrmModule.forFeature([BackupRecord, BackupSettings, BackupActivityLog]),
    MailModule,
  ],
  controllers: [BackupController],
  providers:   [BackupService, S3StorageService],
  exports:     [BackupService],
})
export class BackupModule {}
