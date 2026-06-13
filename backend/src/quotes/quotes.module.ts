import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { MailModule } from '../mail/mail.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MailModule, MessagingModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
