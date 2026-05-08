import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';

import { ContactService } from './contact.service';
import { Roles }          from '../../common/decorators/roles.decorator';
import { Public }         from '../../common/decorators/public.decorator';
import { UserRole }       from '../../common/enums/user-role.enum';
import { GetUser }        from '../../common/decorators/current-user.decorator';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactInfoDto,
} from './dto/create-contact-message.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public Access

  // Provides basic facility contact details to unauthenticated site visitors for direct inquiries.
  @Public()
  @Get('info')
  getInfo() {
    return this.contactService.getInfo();
  }

  // Permites public visitors to submit inquiries or support requests directly to the administration.
  @Public()
  @Post('message')
  createMessage(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateContactMessageDto,
  ) {
    return this.contactService.createMessage(dto);
  }

  // Administrative Control

  // Allows authorized staff to update the public-facing contact information for the facility.
  @Put('info')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateInfo(
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateContactInfoDto,
  ) {
    return this.contactService.updateInfo(dto);
  }

  // Returns a paginated list of contact messages.
  @Get('messages')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllMessages(
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('status') status?: 'pending' | 'replied',
  ) {
    const pageNum  = page  ? parseInt(page,  10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.contactService.getAllMessages(pageNum, limitNum, status);
  }

  // Returns granular details for a specific inquiry, including its original content and metadata.
  @Get('messages/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMessage(@Param('id') id: string) {
    return this.contactService.getMessage(id);
  }

  // Enables administrators to send responses to user inquiries while tracking which staff member handled the reply.
  @Post('messages/:id/reply')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  replyToMessage(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: ReplyContactMessageDto,
    @GetUser('sub') admin_user_Id: string,
  ) {
    return this.contactService.replyToMessage(id, dto, admin_user_Id);
  }

  // Permanently removes a message record once it has been processed or resolved.
  @Delete('messages/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}