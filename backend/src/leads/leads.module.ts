import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { MailModule } from '../mail/mail.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MailModule, MessagingModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
