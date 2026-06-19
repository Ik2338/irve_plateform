import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { sortConversationsForInbox } from '../src/messaging/messaging-sort';

test('sortConversationsForInbox puts unread conversations first, then newest activity', () => {
  const conversations = [
    { id: 'read-new', unreadCount: 0, lastMessageAt: '2026-06-19T10:00:00.000Z' },
    { id: 'unread-old', unreadCount: 2, lastMessageAt: '2026-06-19T08:00:00.000Z' },
    { id: 'read-old', unreadCount: 0, lastMessageAt: '2026-06-18T08:00:00.000Z' },
    { id: 'unread-new', unreadCount: 1, lastMessage: { createdAt: '2026-06-19T12:00:00.000Z' } },
  ];

  assert.deepEqual(
    sortConversationsForInbox(conversations).map((conversation) => conversation.id),
    ['unread-new', 'unread-old', 'read-new', 'read-old'],
  );
});

test('sortConversationsForInbox does not mutate the input array', () => {
  const conversations = [
    { id: 'a', unreadCount: 0, updatedAt: '2026-06-19T09:00:00.000Z' },
    { id: 'b', unreadCount: 1, updatedAt: '2026-06-19T08:00:00.000Z' },
  ];

  const sorted = sortConversationsForInbox(conversations);

  assert.deepEqual(conversations.map((conversation) => conversation.id), ['a', 'b']);
  assert.deepEqual(sorted.map((conversation) => conversation.id), ['b', 'a']);
});
