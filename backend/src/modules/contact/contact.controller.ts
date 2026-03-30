/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ContactService } from './contact.service';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../../common/guards/roles.guard';
import { Roles }        from '../../common/decorators/roles.decorator';
import { UserRole }     from '../../common/enums/user-role.enum';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  /** GET /api/contact/info — system phone, email, address */
  @Get('info')
  getInfo() {
    return this.contactService.getInfo();
  }

  /** POST /api/contact/message — visitor submits a contact form */
  @Post('message')
  createMessage(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateContactMessageDto,
  ) {
    return this.contactService.createMessage(dto);
  }

  // ── Admin: contact info management ────────────────────────────────────────

  /**
   * PUT /api/contact/info
   * Update the system's contact details (email, phone numbers, address …).
   * These are shown on the public Contact page and used as the sender info
   * in reply emails.
   */
  @Put('info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateInfo(
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateContactInfoDto,
  ) {
    return this.contactService.updateInfo(dto);
  }

  // ── Admin: message management ─────────────────────────────────────────────

  /** GET /api/contact/messages */
  @Get('messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllMessages() {
    return this.contactService.getAllMessages();
  }

  /** GET /api/contact/messages/:id */
  @Get('messages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getMessage(@Param('id') id: string) {
    return this.contactService.getMessage(id);
  }

  /**
   * POST /api/contact/messages/:id/reply
   * Admin sends a reply — the response is persisted AND an email is dispatched
   * to the original sender automatically.
   */
  @Post('messages/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  replyToMessage(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ReplyContactMessageDto,
    @Req() req: Request,
  ) {
    const adminId = (req.user as any)?.id ?? (req.user as any)?.sub;
    return this.contactService.replyToMessage(id, dto, adminId);
  }

  /** DELETE /api/contact/messages/:id */
  @Delete('messages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}
