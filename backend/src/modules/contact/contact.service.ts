import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto, ReplyContactMessageDto } from './dto/create-contact-message.dto';

// ─── Static contact info (configure via env or a settings table) ───────────
const CONTACT_INFO = {
  phonePrimary:    process.env.CONTACT_PHONE_PRIMARY    ?? '+94 11 123 4567',
  phoneEmergency:  process.env.CONTACT_PHONE_EMERGENCY  ?? '+94 77 000 0000',
  email:           process.env.CONTACT_EMAIL            ?? 'info@carehome.lk',
  addressLine1:    process.env.CONTACT_ADDRESS_LINE1    ?? '123 Serenity Lane',
  addressLine2:    process.env.CONTACT_ADDRESS_LINE2    ?? undefined,
  city:            process.env.CONTACT_CITY             ?? 'Colombo',
  openHours:       process.env.CONTACT_OPEN_HOURS       ?? 'Mon–Fri: 8 AM – 6 PM',
  mapUrl:          process.env.CONTACT_MAP_URL          ?? undefined,
};

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  // ── Public: static info ────────────────────────────────────────────────────
  getInfo() {
    return CONTACT_INFO;
  }

  // ── Public: submit a message ──────────────────────────────────────────────
  async createMessage(dto: CreateContactMessageDto): Promise<{ message: string }> {
    const entity = this.repo.create({
      fullName: dto.fullName,
      email:    dto.email,
      phone:    dto.phone,
      message:  dto.message,
      status:   'pending',
    });
    await this.repo.save(entity);
    return { message: 'Your message has been received. We will be in touch within 24 hours.' };
  }

  // ── Admin: list all messages ──────────────────────────────────────────────
  async getAllMessages(): Promise<{ messages: ContactMessage[]; total: number; pending: number }> {
    const messages = await this.repo.find({
      order: { createdAt: 'DESC' },
    });
    const pending = messages.filter((m) => m.status === 'pending').length;
    return { messages, total: messages.length, pending };
  }

  // ── Admin: get single message ─────────────────────────────────────────────
  async getMessage(id: string): Promise<ContactMessage> {
    const msg = await this.repo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  // ── Admin: reply to a message ─────────────────────────────────────────────
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
    const saved = await this.repo.save(msg);
    return { message: 'Reply saved successfully.', data: saved };
  }

  // ── Admin: delete a message ───────────────────────────────────────────────
  async deleteMessage(id: string): Promise<{ message: string }> {
    const msg = await this.getMessage(id);
    await this.repo.remove(msg);
    return { message: 'Message deleted.' };
  }
}