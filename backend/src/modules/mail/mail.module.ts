import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailService } from './mail.service';

// Orchestrates the delivery of system-generated notifications and secure communication via SMTP.
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  // Exported so authentication, contact, and administrative modules can dispatch automated emails.
  exports: [MailService],
})
export class MailModule {}
