import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as contactApi from '../../../../api/contact/admin-contact.api';
import type { ContactMessage } from '../../../../api/contact/contact.types';

import { IconInbox, IconReply, IconTrash, IconBack, IconClock, IconSpinner, IconRefresh } from '../../common/icons';
import Pagination from '../../common/Pagination';

// Number of messages displayed per page.
// This value is sent to the backend as the `limit` query parameter so there
const PAGE_SIZE = 5;

// Formats the date and time for messages
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// Shows if a message has been replied to or is still pending

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

// A single message summary in the inbox list

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

// Full page view for reading a specific message and writing a reply

const MessageDetail: React.FC<{
  msg: ContactMessage;
  onBack: () => void;
  onReplied: (updated: ContactMessage) => void;
  onDelete: () => void;
  addToast: (kind: 'success' | 'error', text: string) => void;
}> = ({ msg, onBack, onReplied, onDelete, addToast }) => {
  const [reply,   setReply]   = useState('');
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  // Saves the reply and marks the message as replied
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

// Main inbox page for admins to see messages from the contact form

interface Props {
  addToast: (kind: 'success' | 'error', message: string) => void;
}

const ContactMessages: React.FC<Props> = ({ addToast }) => {
  const [messages,    setMessages]    = useState<ContactMessage[]>([]);
  const [total,       setTotal]       = useState(0);
  const [pending,     setPending]     = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<ContactMessage | null>(null);
  const [filter,      setFilter]      = useState<'all' | 'pending' | 'replied'>('all');

  // Loads one page of messages from the server.
  const load = useCallback(async (page: number, status: typeof filter) => {
    setLoading(true);
    try {
      const data = await contactApi.getAllMessages(
        page,
        PAGE_SIZE,
        status === 'all' ? undefined : status,
      );
      setMessages(data.messages ?? []);
      setTotal(data.total);
      setPending(data.pending);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Reload whenever the current page or filter changes.
  useEffect(() => { load(currentPage, filter); }, [currentPage, filter, load]);

  // Switching filter tabs always resets back to page 1.
  const handleFilterChange = (next: typeof filter) => {
    setFilter(next);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await contactApi.deleteMessage(id);
      addToast('success', 'Message deleted.');
      if (selected?.id === id) setSelected(null);
      load(currentPage, filter);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const handleReplied = (updated: ContactMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelected(updated);
    setPending((p) => Math.max(0, p - 1));
  };


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

      {/* Header */}
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

          {/* Toolbar: refresh + filter tabs */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1">
            <button
              onClick={() => load(currentPage, filter)}
              disabled={loading}
              title="Refresh messages"
              className="flex items-center justify-center rounded-xl px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-50"
            >
              <IconRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </button>
            <div className="mx-1 h-4 w-px bg-slate-200" />
            {(['all', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
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

      {/* Message list / empty / loading states */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <IconSpinner className="h-12 w-12 text-emerald-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
          <IconInbox className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">
            {filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                onClick={() => setSelected(msg)}
                onDelete={() => handleDelete(msg.id)}
              />
            ))}
          </div>

          {/* Pagination bar */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </>
      )}

    </div>
  );
};

export default ContactMessages;