function timestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function conversationActivityTimestamp(conversation) {
  return Math.max(
    timestamp(conversation?.lastMessage?.createdAt),
    timestamp(conversation?.lastMessageAt),
    timestamp(conversation?.updatedAt),
    timestamp(conversation?.createdAt),
  );
}

export function sortConversationsForInbox(conversations) {
  return [...(conversations || [])].sort((a, b) => {
    const unreadDelta = Number((b?.unreadCount ?? 0) > 0) - Number((a?.unreadCount ?? 0) > 0);
    if (unreadDelta !== 0) return unreadDelta;
    return conversationActivityTimestamp(b) - conversationActivityTimestamp(a);
  });
}

export function getAttachmentHref(file) {
  return file?.dataUrl || file?.url || file?.fileUrl || '';
}

export function isImageAttachment(file) {
  const mimeType = String(file?.mimeType || '').toLowerCase();
  const href = getAttachmentHref(file);
  return mimeType.startsWith('image/') || /^data:image\//i.test(href);
}
