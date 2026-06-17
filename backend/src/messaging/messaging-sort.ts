type ConversationForSort = {
  unreadCount?: number | null;
  lastMessageAt?: Date | string | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
  lastMessage?: { createdAt?: Date | string | null } | null;
};

function timestamp(value?: Date | string | null) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function conversationActivityTimestamp(conversation: ConversationForSort) {
  return Math.max(
    timestamp(conversation.lastMessage?.createdAt),
    timestamp(conversation.lastMessageAt),
    timestamp(conversation.updatedAt),
    timestamp(conversation.createdAt),
  );
}

export function sortConversationsForInbox<T extends ConversationForSort>(conversations: T[]): T[] {
  return [...conversations].sort((a, b) => {
    const unreadDelta = Number((b.unreadCount ?? 0) > 0) - Number((a.unreadCount ?? 0) > 0);
    if (unreadDelta !== 0) return unreadDelta;

    return conversationActivityTimestamp(b) - conversationActivityTimestamp(a);
  });
}
