import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactMessage }    from './entities/contact-message.entity';
import { ContactInfo }       from './entities/contact-info.entity';
import { ContactService }    from './contact.service';
import { ContactController } from './contact.controller';
import { MailModule }        from '../mail/mail.module';


// Aggregates communication tools and facility contact data management to provide a unified inquiry portal for users.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactMessage, 
      ContactInfo
    ]),
    MailModule,
  ],
  controllers: [ContactController],
  providers:   [ContactService],
  exports:     [ContactService],
})
export class ContactModule {}
