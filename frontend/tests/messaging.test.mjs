import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAttachmentHref,
  isImageAttachment,
  sortConversationsForInbox,
} from '../src/lib/messaging.mjs';

test('sortConversationsForInbox puts unread conversations first and sorts each group by latest activity', () => {
  const conversations = [
    { id: 'read-new', unreadCount: 0, lastMessageAt: '2026-06-19T10:00:00.000Z' },
    { id: 'unread-old', unreadCount: 3, lastMessageAt: '2026-06-19T08:00:00.000Z' },
    { id: 'read-old', unreadCount: 0, updatedAt: '2026-06-18T10:00:00.000Z' },
    { id: 'unread-new', unreadCount: 1, lastMessage: { createdAt: '2026-06-19T12:00:00.000Z' } },
  ];

  assert.deepEqual(
    sortConversationsForInbox(conversations).map((conversation) => conversation.id),
    ['unread-new', 'unread-old', 'read-new', 'read-old'],
  );
});

test('attachment helpers resolve image previews from mime type and data URLs', () => {
  const dataUrlImage = { fileName: 'photo.png', dataUrl: 'data:image/png;base64,abc' };
  const mimeImage = { fileName: 'photo.jpg', mimeType: 'image/jpeg', url: 'https://cdn.example.test/photo.jpg' };
  const pdf = { fileName: 'contract.pdf', mimeType: 'application/pdf', fileUrl: 'https://cdn.example.test/contract.pdf' };

  assert.equal(isImageAttachment(dataUrlImage), true);
  assert.equal(isImageAttachment(mimeImage), true);
  assert.equal(isImageAttachment(pdf), false);
  assert.equal(getAttachmentHref(pdf), 'https://cdn.example.test/contract.pdf');
});
