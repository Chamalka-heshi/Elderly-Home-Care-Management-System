import {
  Body, Controller, Delete, Get, Param, Post,
  Req, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ContactService } from './contact.service';
import { CreateContactMessageDto, ReplyContactMessageDto } from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../../common/guards/roles.guard';
import { Roles }        from '../../common/decorators/roles.decorator';
import { UserRole }     from '../../common/enums/user-role.enum'; // ← adjust path if needed

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  /** GET /api/contact/info */
  @Get('info')
  getInfo() {
    return this.contactService.getInfo();
  }

  /** POST /api/contact/message */
  @Post('message')
  createMessage(@Body(new ValidationPipe({ whitelist: true })) dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }

  // ── Admin-only ────────────────────────────────────────────────────────────

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

  /** POST /api/contact/messages/:id/reply
   *  Extracts the logged-in admin's id from the JWT payload and stores it.
   *  req.user is populated by JwtStrategy — adjust .id / .sub to match yours.
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