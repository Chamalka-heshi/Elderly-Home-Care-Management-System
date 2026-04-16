import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactInfo } from './entities/contact-info.entity';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly messageRepo: Repository<ContactMessage>,
    @InjectRepository(ContactInfo)
    private readonly infoRepo: Repository<ContactInfo>,
    private readonly mailService: MailService,
  ) {}

  // ── Public: DB-backed contact info ────────────────────────────────────────

  async getInfo(): Promise<ContactInfo> {
    const row = await this.infoRepo.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (!row) throw new NotFoundException('Contact information not found');
    return row;
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

  // ── Private: build & send reply email via MailService ─────────────────────

  private async sendReplyEmail(msg: ContactMessage): Promise<void> {
    const info       = await this.getInfo();
    const systemName = process.env.SYSTEM_NAME ?? 'Care Home Management System';
    const fromEmail  = process.env.SMTP_USER ?? info.email ?? 'noreply@carehome.lk';

    const html = await this.mailService.buildReplyEmailHtml({
      recipientName: msg.fullName,
      reply:         msg.reply ?? '',
      originalMsg:   msg.message,
      systemName,
      phonePrimary:  info.phonePrimary ?? '',
      systemEmail:   info.email        ?? fromEmail,
    });

    await this.mailService.sendMail({
      from:    `"${systemName}" <${fromEmail}>`,
      to:      `"${msg.fullName}" <${msg.email}>`,
      subject: `Re: Your enquiry — ${systemName}`,
      html,
    });

    this.logger.log(`Reply email sent to ${msg.email}`);
  }
}
