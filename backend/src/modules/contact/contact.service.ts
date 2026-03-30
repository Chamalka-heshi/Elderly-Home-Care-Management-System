/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactInfo } from './entities/contact-info.entity';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly messageRepo: Repository<ContactMessage>,
    @InjectRepository(ContactInfo)
    private readonly infoRepo: Repository<ContactInfo>,
  ) {}

  // ── Public: DB-backed contact info ────────────────────────────────────────

  async getInfo(): Promise<Partial<ContactInfo>> {
    const row = await this.infoRepo.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (row) return row;

    // Env-var fallback before admin saves a row
    return {
      phonePrimary:   process.env.CONTACT_PHONE_PRIMARY   ?? '+94 11 123 4567',
      phoneEmergency: process.env.CONTACT_PHONE_EMERGENCY ?? '+94 77 000 0000',
      email:          process.env.CONTACT_EMAIL           ?? 'info@carehome.lk',
      addressLine1:   process.env.CONTACT_ADDRESS_LINE1   ?? '123 Serenity Lane',
      addressLine2:   process.env.CONTACT_ADDRESS_LINE2   ?? undefined,
      city:           process.env.CONTACT_CITY            ?? 'Colombo',
      openHours:      process.env.CONTACT_OPEN_HOURS      ?? 'Mon–Fri: 8 AM – 6 PM',
      mapUrl:         process.env.CONTACT_MAP_URL         ?? undefined,
    } as Partial<ContactInfo>;
  }

  // ── Admin: upsert contact info ─────────────────────────────────────────────

  async updateInfo(dto: UpdateContactInfoDto): Promise<{ message: string; data: ContactInfo }> {
    let row = await this.infoRepo.findOne({ where: {}, order: { createdAt: 'ASC' } });
    if (!row) {
      row = this.infoRepo.create(dto as Partial<ContactInfo>);
    } else {
      Object.assign(row, dto);
    }
    const saved = await this.infoRepo.save(row);
    return { message: 'Contact information updated successfully.', data: saved };
  }

  // ── Public: submit a message ───────────────────────────────────────────────

  async createMessage(dto: CreateContactMessageDto): Promise<{ message: string }> {
    const entity = this.messageRepo.create({
      fullName: dto.fullName,
      email:    dto.email,
      phone:    dto.phone,
      message:  dto.message,
      status:   'pending',
    });
    await this.messageRepo.save(entity);
    return { message: 'Your message has been received. We will be in touch within 24 hours.' };
  }

  // ── Admin: list all messages ───────────────────────────────────────────────

  async getAllMessages(): Promise<{ messages: ContactMessage[]; total: number; pending: number }> {
    const messages = await this.messageRepo.find({ order: { createdAt: 'DESC' } });
    const pending  = messages.filter((m) => m.status === 'pending').length;
    return { messages, total: messages.length, pending };
  }

  // ── Admin: get single message ──────────────────────────────────────────────

  async getMessage(id: string): Promise<ContactMessage> {
    const msg = await this.messageRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  // ── Admin: reply (save + send email) ──────────────────────────────────────

  async replyToMessage(
    id: string,
    dto: ReplyContactMessageDto,
    adminId: string,
  ): Promise<{ message: string; data: ContactMessage }> {
    const msg = await this.getMessage(id);

    if (msg.status === 'replied') {
      throw new BadRequestException('This message has already been replied to.');
    }

    msg.reply            = dto.reply;
    msg.repliedAt        = new Date();
    msg.repliedByAdminId = adminId;
    msg.status           = 'replied';

    const saved = await this.messageRepo.save(msg);

    // Fire-and-forget — reply is persisted regardless of SMTP outcome
    this.sendReplyEmail(saved).catch((err) =>
      this.logger.error('Reply email failed to send', err?.message),
    );

    return { message: 'Reply saved and email sent to the sender.', data: saved };
  }

  // ── Admin: delete a message ────────────────────────────────────────────────

  async deleteMessage(id: string): Promise<{ message: string }> {
    const msg = await this.getMessage(id);
    await this.messageRepo.remove(msg);
    return { message: 'Message deleted.' };
  }

  // ── Private: build & send reply email ─────────────────────────────────────

  private async sendReplyEmail(msg: ContactMessage): Promise<void> {
    // Create transporter lazily so env vars are guaranteed to be loaded
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info       = await this.getInfo();
    const systemName = process.env.SYSTEM_NAME ?? 'Care Home Management System';
    const fromEmail  = process.env.SMTP_USER ?? info.email ?? 'noreply@carehome.lk';

    const html = this.buildReplyEmailHtml({
      recipientName: msg.fullName,
      reply:         msg.reply ?? '',
      originalMsg:   msg.message,
      systemName,
      phonePrimary:  info.phonePrimary ?? '',
      systemEmail:   info.email        ?? fromEmail,
    });

    await transporter.sendMail({
      from:    `"${systemName}" <${fromEmail}>`,
      to:      `"${msg.fullName}" <${msg.email}>`,
      subject: `Re: Your enquiry — ${systemName}`,
      html,
    });

    this.logger.log(`Reply email sent to ${msg.email}`);
  }

  private buildReplyEmailHtml(opts: {
    recipientName: string;
    reply:         string;
    originalMsg:   string;
    systemName:    string;
    phonePrimary:  string;
    systemEmail:   string;
  }): string {
    const safeReply = opts.reply.replace(/\n/g, '<br>');
    const safeMsg   = opts.originalMsg.replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">${opts.systemName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111827;">
              Dear <strong>${opts.recipientName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
              Thank you for contacting us. Our team has reviewed your enquiry and provided the following response:
            </p>

            <!-- Reply box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;padding:20px 24px;">
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#1e3a5f;">${safeReply}</p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

            <!-- Original message -->
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;">
              Your original message
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${safeMsg}</p>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 8px;font-size:14px;color:#374151;">
              If you have any further questions, please don't hesitate to contact us:
            </p>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">
                  &#128222; <strong>${opts.phonePrimary}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">
                  &#9993;&#65039; <a href="mailto:${opts.systemEmail}"
                      style="color:#2563eb;text-decoration:none;">${opts.systemEmail}</a>
                </td>
              </tr>
            </table>

            <p style="margin:32px 0 0;font-size:14px;color:#374151;">
              Warm regards,<br>
              <strong>${opts.systemName} Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This is an automated response. Please do not reply directly to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}