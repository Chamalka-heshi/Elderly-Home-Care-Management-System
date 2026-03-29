import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports:     [TypeOrmModule.forFeature([ContactMessage])],
  controllers: [ContactController],
  providers:   [ContactService],
  exports:     [ContactService],
})
export class ContactModule {}