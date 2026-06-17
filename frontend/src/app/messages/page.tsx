'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, UserRound, Zap } from 'lucide-react';
import ClientNav from '@/components/ClientNav';
import InstallerNav from '@/components/InstallerNav';
import { messagingApi } from '@/lib/api';
import { sortConversationsForInbox } from '@/lib/messaging';

function ConversationNav({ role }: { role?: string }) {
  if (role === 'INSTALLER') return <InstallerNav />;
  if (role === 'CLIENT') return <ClientNav />;
  return null;
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('irve_user');
    if (!raw) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await messagingApi.list();
        if (mounted) setConversations(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 10000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = sortConversationsForInbox(conversations);
    if (!q) return sorted;
    return sorted.filter((c: any) => {
      const other =
        user?.role === 'INSTALLER'
          ? `${c.client?.firstName ?? ''} ${c.client?.lastName ?? ''}`
          : c.installer?.companyName ?? '';
      const project = `${c.request?.projectType ?? ''} ${c.request?.city ?? ''}`;
      return `${other} ${project}`.toLowerCase().includes(q);
    });
  }, [conversations, query, user?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ConversationNav role={user?.role} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">Conversations clients et installateurs</p>
          </div>
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-primary-light items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une conversation"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="animate-spin w-7 h-7 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800">Aucune conversation</p>
              <p className="text-sm text-gray-500 mt-1">Vos echanges apparaitront ici.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((conversation) => {
                const other =
                  user?.role === 'INSTALLER'
                    ? `${conversation.client?.firstName ?? ''} ${conversation.client?.lastName ?? ''}`
                    : conversation.installer?.companyName;
                const subtitle = conversation.request
                  ? `${conversation.request.projectType} - ${conversation.request.powerLevel} - ${conversation.request.city}`
                  : conversation.context === 'PRE_REQUEST'
                  ? 'Avant demande'
                  : conversation.context;
                const last = conversation.lastMessage;

                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                      {other?.[0]?.toUpperCase() || <UserRound className="w-5 h-5" />}
                      <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900 truncate">{other}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(last?.createdAt ?? conversation.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="truncate">{subtitle}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {last ? last.body : 'Conversation creee'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="min-w-6 h-6 px-2 rounded-full bg-primary text-white text-xs leading-6 text-center font-bold">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
