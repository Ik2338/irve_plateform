import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagingController {
  constructor(private service: MessagingService) {}

  @Post('conversations/start')
  @ApiOperation({ summary: 'Creer ou ouvrir une conversation client-installateur' })
  start(@CurrentUser() user: any, @Body() dto: StartConversationDto) {
    return this.service.startConversation(user, {
      installerId: dto.installerId,
      requestId: dto.requestId,
      leadId: dto.leadId,
      quoteId: dto.quoteId,
      context: dto.context,
      message: dto.message,
      clientId: user.id,
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste des conversations de l utilisateur' })
  list(@CurrentUser() user: any) {
    return this.service.listConversations(user.id);
  }

  @Get('conversations/unread-count')
  @ApiOperation({ summary: 'Compteur messages et notifications non lus' })
  unread(@CurrentUser() user: any) {
    return this.service.unreadTotal(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Detail conversation avec messages' })
  detail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  send(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(user.id, id, dto.body, dto.attachments);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer une conversation comme lue' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.id);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Notifications de l utilisateur' })
  notifications(@CurrentUser() user: any) {
    return this.service.listNotifications(user.id);
  }

  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  readAllNotifications(@CurrentUser() user: any) {
    return this.service.markAllNotificationsRead(user.id);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  readNotification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markNotificationRead(id, user.id);
  }
}
