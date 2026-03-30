/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactInfo }    from './entities/contact-info.entity';
import { ContactService }    from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([ContactMessage, ContactInfo])],
  controllers: [ContactController],
  providers:   [ContactService],
  exports:     [ContactService],
})
export class ContactModule {}
