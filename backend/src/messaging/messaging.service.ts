import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationContext, NotificationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { sortConversationsForInbox } from './messaging-sort';

type EnsureConversationInput = {
  clientId: string;
  installerId: string;
  requestId?: string | null;
  leadId?: string | null;
  quoteId?: string | null;
  context?: ConversationContext;
};

type NotificationInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
};

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async startConversation(user: any, input: EnsureConversationInput & { message?: string }) {
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Seuls les clients peuvent contacter un installateur depuis son profil.');
    }

    const conversation = await this.ensureConversation({
      ...input,
      clientId: user.id,
      context: input.context ?? ConversationContext.PRE_REQUEST,
    });

    if (input.message?.trim()) {
      await this.sendMessage(user.id, conversation.id, input.message);
    }

    return this.findOne(conversation.id, user.id);
  }

  async ensureConversation(input: EnsureConversationInput) {
    const installer = await this.prisma.installer.findUnique({
      where: { id: input.installerId },
      include: { user: { select: { id: true } } },
    });
    if (!installer) throw new NotFoundException('Installateur introuvable');

    const context = input.context ?? ConversationContext.PRE_REQUEST;
    const where: any = {
      clientId: input.clientId,
      installerId: input.installerId,
    };

    if (input.quoteId) where.quoteId = input.quoteId;
    else if (input.leadId) where.leadId = input.leadId;
    else if (input.requestId) where.requestId = input.requestId;
    else where.context = ConversationContext.PRE_REQUEST;

    let existing = await this.prisma.conversation.findFirst({ where });
    if (!existing && input.quoteId && input.requestId) {
      existing = await this.prisma.conversation.findFirst({
        where: { clientId: input.clientId, installerId: input.installerId, requestId: input.requestId },
      });
    }
    if (!existing && input.requestId) {
      existing = await this.prisma.conversation.findFirst({
        where: {
          clientId: input.clientId,
          installerId: input.installerId,
          context: ConversationContext.PRE_REQUEST,
          requestId: null,
          leadId: null,
          quoteId: null,
        },
      });
    }
    if (existing) {
      const shouldPromote =
        context !== existing.context &&
        existing.context !== ConversationContext.PROJECT;
      return this.prisma.conversation.update({
        where: { id: existing.id },
        data: {
          context,
          requestId: input.requestId ?? existing.requestId,
          leadId: input.leadId ?? existing.leadId,
          quoteId: input.quoteId ?? existing.quoteId,
        },
      });
    }

    return this.prisma.conversation.create({
      data: {
        clientId: input.clientId,
        installerId: input.installerId,
        requestId: input.requestId ?? undefined,
        leadId: input.leadId ?? undefined,
        quoteId: input.quoteId ?? undefined,
        context,
        participants: {
          create: [
            { userId: input.clientId },
            { userId: installer.user.id },
          ],
        },
      },
    });
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        installer: {
          select: {
            id: true,
            companyName: true,
            city: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        request: { select: { id: true, projectType: true, powerLevel: true, city: true, status: true } },
        lead: { select: { id: true, address: true, status: true } },
        quote: { select: { id: true, amount: true, status: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: [
        { lastMessageAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    const withUnreadCounts = await Promise.all(conversations.map(async (conversation) => ({
      ...conversation,
      lastMessage: conversation.messages[0] ?? null,
      unreadCount: await this.prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          readAt: null,
        },
      }),
    })));

    return sortConversationsForInbox(withUnreadCounts);
  }

  async findOne(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.markRead(conversationId, userId);

    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        installer: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        request: true,
        lead: true,
        quote: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    });
  }

  async sendMessage(userId: string, conversationId: string, body = '', attachments: any[] = []) {
    const text = body.trim();
    if (!text && attachments.length === 0) {
      throw new BadRequestException('Le message ne peut pas etre vide.');
    }

    const conversation = await this.assertParticipant(conversationId, userId);
    const recipient = conversation.participants.find((p) => p.userId !== userId);
    if (!recipient) throw new BadRequestException('Conversation sans destinataire.');

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body: text, attachments },
      include: { sender: { select: { firstName: true, lastName: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    await this.createNotification({
      userId: recipient.userId,
      actorId: userId,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nouveau message',
      body: `${message.sender.firstName} ${message.sender.lastName}: ${text ? text.slice(0, 120) : 'Piece jointe'}`,
      link: `/messages/${conversationId}`,
    });

    return message;
  }

  async unreadTotal(userId: string) {
    const rows = await this.prisma.message.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: { participants: { some: { userId } } },
      },
    });

    const notifications = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { messages: rows, notifications, total: rows + notifications };
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification introuvable');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async createNotification(input: NotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? undefined,
        type: input.type,
        title: input.title,
        body: input.body ?? undefined,
        link: input.link ?? undefined,
      },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    if (!conversation.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException('Acces non autorise a cette conversation');
    }
    return conversation;
  }

  private async markRead(conversationId: string, userId: string) {
    const now = new Date();
    await Promise.all([
      this.prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, readAt: null },
        data: { readAt: now },
      }),
      this.prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: now },
      }),
    ]);
  }
}
