'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CheckCheck, FileText, Paperclip, SendHorizonal, UserRound, X } from 'lucide-react';
import ClientNav from '@/components/ClientNav';
import InstallerNav from '@/components/InstallerNav';
import { messagingApi } from '@/lib/api';
import toast from 'react-hot-toast';

function ConversationNav({ role }: { role?: string }) {
  if (role === 'INSTALLER') return <InstallerNav />;
  if (role === 'CLIENT') return <ClientNav />;
  return null;
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('irve_user');
    if (!raw) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await messagingApi.get(id);
        if (mounted) setConversation(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Conversation introuvable.');
        router.push('/messages');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages?.length]);

  const other = useMemo(() => {
    if (!conversation || !user) return null;
    if (user.role === 'INSTALLER') {
      return {
        name: `${conversation.client?.firstName ?? ''} ${conversation.client?.lastName ?? ''}`.trim(),
        email: conversation.client?.email,
        phone: conversation.client?.phone,
      };
    }
    return {
      name: conversation.installer?.companyName,
      email: conversation.installer?.user?.email,
      phone: conversation.installer?.user?.phone,
    };
  }, [conversation, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await messagingApi.send(id, text, attachments);
      setBody('');
      setAttachments([]);
      const { data } = await messagingApi.get(id);
      setConversation(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const addAttachments = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = await Promise.all(Array.from(files).map(file => new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        fileName: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result || ''),
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setAttachments(current => [...current, ...next]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConversationNav role={user?.role} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-h-[calc(100vh-8rem)] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 bg-white sticky top-14 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/messages" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="relative w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                {other?.name?.[0]?.toUpperCase() || <UserRound className="w-5 h-5" />}
                <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 truncate">{other?.name}</h1>
                <p className="text-xs text-green-600">En ligne</p>
              </div>
            </div>
            {conversation?.request && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>{conversation.request.projectType} - {conversation.request.city}</span>
              </div>
            )}
          </div>

          {conversation?.request && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-sm text-blue-800">
              <CalendarClock className="w-4 h-4 flex-shrink-0" />
              <span>
                Projet {conversation.request.projectType} - {conversation.request.powerLevel} - statut {conversation.request.status}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {conversation?.messages?.length ? (
              conversation.messages.map((message: any) => {
                const mine = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[82%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        mine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
                      {message.attachments?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((file: any, index: number) => (
                            <a
                              key={`${file.fileName}-${index}`}
                              href={file.dataUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                                mine ? 'bg-white/15 text-white' : 'bg-gray-50 text-primary border border-gray-100'
                              }`}
                            >
                              <FileText className="w-3 h-3" />{file.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${mine ? 'text-white/75' : 'text-gray-400'}`}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {mine && (
                          <span className="inline-flex items-center gap-0.5">
                            <CheckCheck className="w-3.5 h-3.5" />
                            {message.readAt ? 'lu' : 'envoye'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full min-h-[18rem] flex items-center justify-center text-center text-gray-500">
                <div>
                  <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-gray-100 flex items-center justify-center mb-3">
                    <UserRound className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-800">Demarrez la conversation</p>
                  <p className="text-sm">Posez vos questions, partagez les documents et organisez l'installation ici.</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <span key={`${file.fileName}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1 text-xs text-gray-700">
                    <FileText className="w-3 h-3 text-primary" />{file.fileName}
                    <button
                      type="button"
                      onClick={() => setAttachments(items => items.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500"
                      title="Retirer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="w-11 h-11 rounded-xl border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 cursor-pointer" title="Ajouter une piece jointe">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => addAttachments(e.target.files)}
                />
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={1}
                placeholder="Ecrire un message"
                className="flex-1 max-h-32 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!body.trim() || sending}
                className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Envoyer"
              >
                <SendHorizonal className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
