import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService }    from './quotes.service';
import { MailModule }       from '../mail/mail.module';

@Module({
  imports:     [MailModule],
  controllers: [QuotesController],   
  providers:   [QuotesService],
  exports:     [QuotesService],
})
export class QuotesModule {}