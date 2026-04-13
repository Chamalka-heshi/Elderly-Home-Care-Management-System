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
  ValidationPipe,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';
import { Roles }        from '../../common/decorators/roles.decorator';
import { Public }       from '../../common/decorators/public.decorator';
import { UserRole }     from '../../common/enums/user-role.enum';

// JWT + RolesGuard are enforced globally via APP_GUARD in AppModule.
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  /** GET /api/contact/info — system phone, email, address */
  @Public()
  @Get('info')
  getInfo() {
    return this.contactService.getInfo();
  }

  /** POST /api/contact/message — visitor submits a contact form */
  @Public()
  @Post('message')
  createMessage(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateContactMessageDto,
  ) {
    return this.contactService.createMessage(dto);
  }

  // ── Admin: contact info management ────────────────────────────────────────

  @Put('info')
  @Roles(UserRole.ADMIN)
  updateInfo(
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateContactInfoDto,
  ) {
    return this.contactService.updateInfo(dto);
  }

  // ── Admin: message management ─────────────────────────────────────────────

  @Get('messages')
  @Roles(UserRole.ADMIN)
  getAllMessages() {
    return this.contactService.getAllMessages();
  }

  @Get('messages/:id')
  @Roles(UserRole.ADMIN)
  getMessage(@Param('id') id: string) {
    return this.contactService.getMessage(id);
  }

  @Post('messages/:id/reply')
  @Roles(UserRole.ADMIN)
  replyToMessage(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ReplyContactMessageDto,
    @Req() req: { user: { sub: string } },
  ) {
    const adminId = req.user?.sub;
    return this.contactService.replyToMessage(id, dto, adminId);
  }

  @Delete('messages/:id')
  @Roles(UserRole.ADMIN)
  deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}