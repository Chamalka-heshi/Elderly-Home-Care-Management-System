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
import { MailService } from '../mail/mail.service';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';

const INITIAL_MESSAGE_STATUS = 'pending';
const REPLIED_MESSAGE_STATUS = 'replied';

export interface PaginatedMessages {
  messages: ContactMessage[];
  total: number;
  pending: number;
  page: number;
  totalPages: number;
}

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

  // Contact Information

  // Retrieves the current facility contact record, ensuring clinical partners and families can always find verified communication channels.
  async getInfo(): Promise<ContactInfo> {
    const row = await this.infoRepo.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (!row) throw new NotFoundException('Contact information not found');
    return row;
  }

  // Updates or initializes the facility's master contact record to maintain accuracy across all public-facing platforms.
  async updateInfo(
    dto: UpdateContactInfoDto,
  ): Promise<{ message: string; data: ContactInfo }> {
    let row = await this.infoRepo.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    if (!row) {
      row = this.infoRepo.create(dto as Partial<ContactInfo>);
    } else {
      Object.assign(row, dto);
    }

    const saved = await this.infoRepo.save(row);
    return {
      message: 'Contact information updated successfully.',
      data: saved,
    };
  }

  // Message Management

  // Persists a new user inquiry into the database with a pending status, initiating the administrative review workflow.
  async createMessage(
    dto: CreateContactMessageDto,
  ): Promise<{ message: string }> {
    const entity = this.messageRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      message: dto.message,
      status: INITIAL_MESSAGE_STATUS,
    });

    await this.messageRepo.save(entity);
    return {
      message:
        'Your message has been received. We will be in touch within 24 hours.',
    };
  }

  // Returns a paginated slice of contact messages, optionally filtered by status.
  async getAllMessages(
    page: number = 1,
    limit: number = 10,
    status?: 'pending' | 'replied',
  ): Promise<PaginatedMessages> {
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Number(limit));
    const skip = (safePage - 1) * safeLimit;

    const where = status ? { status } : {};

    const [messages, total] = await this.messageRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: safeLimit,
    });

    // Pending count always reflects the global unfiltered total for the header badge.
    const pending = await this.messageRepo.count({
      where: { status: INITIAL_MESSAGE_STATUS },
    });

    return {
      messages,
      total,
      pending,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // Retrieves a single inquiry record by its identifier, throwing an error if the record does not exist.
  async getMessage(id: string): Promise<ContactMessage> {
    const msg = await this.messageRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  // Processes an administrative reply, marking the message as resolved and triggering an automated email notification to the sender.
  async replyToMessage(
    id: string,
    dto: ReplyContactMessageDto,
    admin_user_Id: string,
  ): Promise<{ message: string; data: ContactMessage }> {
    const msg = await this.getMessage(id);

    if (msg.status === REPLIED_MESSAGE_STATUS) {
      throw new BadRequestException(
        'This message has already been replied to.',
      );
    }

    msg.reply = dto.reply;
    msg.repliedAt = new Date();
    msg.repliedByAdminId = admin_user_Id;
    msg.status = REPLIED_MESSAGE_STATUS;

    const saved = await this.messageRepo.save(msg);

    // Dispatches the reply via email asynchronously to avoid blocking the main persistence transaction.
    this.sendReplyEmail(saved).catch((err) =>
      this.logger.error('Reply email failed to send', err?.message),
    );

    return {
      message: 'Reply saved and email sent to the sender.',
      data: saved,
    };
  }

  // Removes a contact message from the system, typically used for cleaning up spam or resolved inquiries.
  async deleteMessage(id: string): Promise<{ message: string }> {
    const msg = await this.getMessage(id);
    await this.messageRepo.remove(msg);
    return { message: 'Message deleted.' };
  }

  // Internal Communications

  // Orchestrates the delivery of administrative replies using the facility's official email identity.
  private async sendReplyEmail(msg: ContactMessage): Promise<void> {
    const info = await this.getInfo();

    await this.mailService.sendReplyEmail(
      msg.fullName,
      msg.email,
      msg.reply ?? '',
      msg.message,
      info.phonePrimary ?? '',
      info.email ?? process.env.SMTP_USER ?? '',
    );
  }
}
