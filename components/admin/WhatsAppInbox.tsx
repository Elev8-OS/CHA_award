'use client';

import { useState, useMemo } from 'react';

interface Message {
  id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  body: string | null;
  status: string;
  message_type: string;
  template_name: string | null;
  application_id: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

export function WhatsAppInbox({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Group messages by phone
  const conversations = useMemo(() => {
    const map = new Map<string, Message[]>();
    messages.forEach((m) => {
      const arr = map.get(m.phone_number) || [];
      arr.push(m);
      map.set(m.phone_number, arr);
    });
    return Array.from(map.entries())
      .map(([phone, msgs]) => ({
        phone,
        messages: msgs.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
        latest: msgs[0],
      }))
      .sort(
        (a, b) =>
          new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
      );
  }, [messages]);

  const selectedConvo = conversations.find((c) => c.phone === selectedPhone);

  const sendReply = async () => {
    if (!selectedPhone || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedPhone, body: reply }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Send failed');
      }
      // Optimistic add
      const newMsg: Message = {
        id: crypto.randomUUID(),
        phone_number: selectedPhone,
        direction: 'outbound',
        body: reply,
        status: 'sent',
        message_type: 'text',
        template_name: null,
        application_id: null,
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        delivered_at: null,
        read_at: null,
      };
      setMessages((prev) => [newMsg, ...prev]);
      setReply('');
    } catch (e: any) {
      alert(`Send failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid h-[calc(100vh-200px)] grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <div className="overflow-y-auto border-r border-line">
        {conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-warm-gray">No messages yet.</div>
        )}
        {conversations.map((c) => (
          <button
            key={c.phone}
            onClick={() => setSelectedPhone(c.phone)}
            className={`block w-full border-b border-line px-4 py-3 text-left transition-colors hover:bg-cream ${
              selectedPhone === c.phone ? 'bg-cream' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-navy">{c.phone}</span>
              <span className="text-[10px] text-warm-gray">
                {new Date(c.latest.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1 truncate text-xs text-warm-gray">
              {c.latest.direction === 'outbound' ? '→ ' : '← '}
              {c.latest.body || `[${c.latest.message_type}]`}
            </div>
          </button>
        ))}
      </div>

      {/* Conversation thread */}
      <div className="flex flex-col">
        {selectedConvo ? (
          <>
            <div className="border-b border-line bg-cream/50 px-5 py-3">
              <div className="text-sm font-bold text-navy">{selectedConvo.phone}</div>
              <div className="text-xs text-warm-gray">
                {selectedConvo.messages.length} messages
              </div>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
              {selectedConvo.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
            <div className="border-t border-line p-4">
              <div className="flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply (only valid within 24h customer service window)..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border-[1.5px] border-line bg-white px-4 py-2.5 text-sm focus:border-coral focus:outline-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="self-end rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-warm-gray">
                For unsolicited messages outside 24h window, use approved templates.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-warm-gray">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound';
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOutbound ? 'bg-coral text-white' : 'bg-cream text-navy'
        }`}
      >
        {message.template_name && (
          <div className={`mb-1 text-[10px] font-bold uppercase ${isOutbound ? 'text-white/70' : 'text-warm-gray'}`}>
            Template: {message.template_name}
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.body || `[${message.message_type}]`}</div>
        <div className={`mt-1 text-[10px] ${isOutbound ? 'text-white/70' : 'text-warm-gray'}`}>
          {time} · {message.status}
        </div>
      </div>
    </div>
  );
}
