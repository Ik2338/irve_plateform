import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService }    from './requests.service';
import { InstallersModule }   from '../installers/installers.module';
import { MailModule }         from '../mail/mail.module';

@Module({
  imports: [
    InstallersModule,
    MailModule,   // ✅ Requis pour l'envoi d'emails (demandes ciblées)
  ],
  controllers: [RequestsController],
  providers:   [RequestsService],
  exports:     [RequestsService],
})
export class RequestsModule {}