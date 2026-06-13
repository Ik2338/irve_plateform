'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { messagingApi } from '@/lib/api';

export default function MessagingNavLink({
  active,
  compact = false,
}: {
  active: boolean;
  compact?: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await messagingApi.unreadCount();
        if (mounted) setCount(data?.messages ?? data?.total ?? 0);
      } catch {
        if (mounted) setCount(0);
      }
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/messages"
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
      title="Messages"
    >
      <MessageCircle className="w-4 h-4" />
      {!compact && <span>Messages</span>}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] leading-5 text-center font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
