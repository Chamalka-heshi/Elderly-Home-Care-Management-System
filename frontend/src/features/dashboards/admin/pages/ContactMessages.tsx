import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as contactApi from '../../../../api/contact/admin-contact.api';
import type { ContactMessage } from '../../../../api/contact/contact.types';

import { IconInbox, IconReply, IconTrash, IconBack, IconClock, IconSpinner } from '../../common/icons';

// Format ISO timestamps into user-friendly localized strings for administrative review
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// Visual indicator of message response status to guide administrative workflow prioritization
const StatusBadge: React.FC<{ status: 'pending' | 'replied' }> = ({ status }) =>
  status === 'replied' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Replied
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  );

// Summary view of a contact message to allow quick scanning of the administrative inbox
const MessageRow: React.FC<{
  msg: ContactMessage;
  onClick: () => void;
  onDelete: () => void;
}> = ({ msg, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
      {msg.fullName.charAt(0).toUpperCase()}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-900">{msg.fullName}</p>
        <StatusBadge status={msg.status} />
      </div>
      <p className="mt-0.5 truncate text-xs text-slate-500">{msg.email}</p>
      <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{msg.message}</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
        <IconClock className="h-3.5 w-3.5" />
        {fmtDate(msg.createdAt)}
      </div>
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="flex-shrink-0 rounded-xl p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
      title="Delete message"
    >
      <IconTrash />
    </button>
  </div>
);

// Expanded view and interaction panel for responding to specific inquiries from public users
const MessageDetail: React.FC<{
  msg: ContactMessage;
  onBack: () => void;
  onReplied: (updated: ContactMessage) => void;
  onDelete: () => void;
  addToast: (kind: 'success' | 'error', text: string) => void;
}> = ({ msg, onBack, onReplied, onDelete, addToast }) => {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  // Process the reply to update the message status and record the administrative response
  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await contactApi.replyToMessage(msg.id, reply.trim());
      addToast('success', 'Reply saved successfully.');
      onReplied(res.data);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <IconBack /> Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={msg.status} />
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <IconTrash /> Delete
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
            {msg.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{msg.fullName}</p>
            <a href={`mailto:${msg.email}`} className="text-sm text-emerald-600 hover:underline">
              {msg.email}
            </a>
            {msg.phone && <p className="text-sm text-slate-500">{msg.phone}</p>}
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <IconClock className="h-3.5 w-3.5" /> {fmtDate(msg.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {msg.message}
        </div>
      </div>

      {msg.status === 'replied' && msg.reply && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
            Reply sent · {msg.repliedAt ? fmtDate(msg.repliedAt) : ''}
          </p>
          <p className="text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap">{msg.reply}</p>
        </div>
      )}

      {msg.status === 'pending' && (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <IconReply className="h-4 w-4 text-emerald-600" /> Write a Reply
          </p>
          <textarea
            ref={textRef}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Type your reply here…"
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">{reply.length}/5000</p>
            <button
              onClick={handleReply}
              disabled={!reply.trim() || sending}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <><IconSpinner className="h-4 w-4" /> Sending…</>
              ) : (
                <><IconReply className="h-4 w-4" /> Send Reply</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

// Main inbox container to manage the collection of messages sent via the public contact interface
const ContactMessages: React.FC<Props> = ({ addToast }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');

  // Load all recorded messages to ensure all user inquiries are visible for review
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactApi.getAllMessages();
      const msgs = data.messages || [];

      setMessages(msgs);
      setTotal(msgs.length);
      setPending(msgs.filter((m) => m.status === 'pending').length);

    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await contactApi.deleteMessage(id);
      addToast('success', 'Message deleted.');
      if (selected?.id === id) setSelected(null);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleReplied = (updated: ContactMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelected(updated);
    setPending((p) => Math.max(0, p - 1));
  };

  const displayed = messages.filter((m) =>
    filter === 'all' ? true : m.status === filter,
  );

  if (selected) {
    return (
      <MessageDetail
        msg={selected}
        onBack={() => setSelected(null)}
        onReplied={handleReplied}
        onDelete={() => handleDelete(selected.id)}
        addToast={addToast}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="absolute -right-20 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <IconInbox className="h-3.5 w-3.5" /> Contact Messages
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Inbox</h1>
            <p className="mt-1 text-sm text-slate-500">
              {total} total · <span className="font-semibold text-amber-600">{pending} pending</span>
            </p>
          </div>

          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1">
            {(['all', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition',
                  filter === f
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <IconSpinner className="h-12 w-12 text-emerald-500" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
          <IconInbox className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">
            {filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onClick={() => setSelected(msg)}
              onDelete={() => handleDelete(msg.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;