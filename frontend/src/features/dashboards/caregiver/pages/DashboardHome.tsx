import React, { useState } from "react";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";

// ── Icons ─
const HeartIcon        = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const UsersIcon        = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ClipboardIcon    = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const PillIcon         = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const AlertIcon        = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const CalendarIcon     = ({ className = "h-6 w-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SparkleIcon      = ({ className = "h-4 w-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.2 4.2L17.4 8l-4.2 1.2L12 13.4l-1.2-4.2L6.6 8l4.2-1.8L12 2zm7 7l.8 2.8 2.8.8-2.8.8L19 16.6l-.8-2.8-2.8-.8 2.8-1.2L19 9z" /></svg>;
const ArrowRightIcon   = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const CheckIcon        = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const PhoneIcon        = ({ className = "h-5 w-5" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const XIcon            = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PencilIcon       = ({ className = "h-4 w-4" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ClockIcon        = ({ className = "h-4 w-4" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// ── Data ───────────────────────────────────────────────────────────────────────

const STATS = [
  {
    title: "Assigned Patients",
    value: 6,
    caption: "4 active · 1 incoming · 1 discharged",
    icon: UsersIcon,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    page: "Assigned Patients" as MenuLabel,
  },
  {
    title: "Medications Due Today",
    value: 4,
    caption: "2 pending · 2 administered",
    icon: PillIcon,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    page: "Medication Updates" as MenuLabel,
  },
  {
    title: "Pending Care Notes",
    value: 3,
    caption: "Due by end of shift",
    icon: ClipboardIcon,
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    page: "Care Notes" as MenuLabel,
  },
  {
    title: "Active Alerts",
    value: 2,
    caption: "1 critical · 1 warning",
    icon: AlertIcon,
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    page: "Vital Records" as MenuLabel,
  },
];

const SCHEDULE_TODAY = [
  { time: "06:00", patient: "John Silva",      task: "Morning vitals + medication",    status: "done",    room: "A-101", type: "Vitals"    },
  { time: "08:00", patient: "Anula Wickrama",  task: "Donepezil 10mg + breakfast",    status: "done",    room: "B-202", type: "Medication" },
  { time: "09:00", patient: "Sunil Fernando",  task: "Oxygen check + physio assist",  status: "active",  room: "B-205", type: "Physio"    },
  { time: "10:30", patient: "Kamala Mendis",   task: "Warfarin 5mg + BP monitoring",  status: "pending", room: "C-301", type: "Medication" },
  { time: "12:00", patient: "John Silva",      task: "Amoxicillin 500mg + lunch",     status: "pending", room: "A-101", type: "Nutrition"  },
  { time: "14:00", patient: "Mary Perera",     task: "Admission assessment",          status: "pending", room: "A-104", type: "Admission"  },
];

const ALERTS = [
  { id: "1", patient: "Kamala Mendis",   room: "C-301", type: "critical", message: "BP critical: 160/95 — doctor notified",     time: "08:32 AM" },
  { id: "2", patient: "Sunil Fernando",  room: "B-205", type: "warning",  message: "SpO\u2082 at 94% — monitor closely",         time: "09:10 AM" },
];

const RECENT_NOTES = [
  { id: "1", patient: "John Silva",     category: "Morning Routine", note: "Had breakfast well, completed physio without assistance.", mood: "Good",    time: "08:30" },
  { id: "2", patient: "Anula Wickrama", category: "Medication",      note: "Donepezil administered with breakfast, no side effects.",  mood: "Good",    time: "10:00" },
  { id: "3", patient: "Sunil Fernando", category: "Vital Signs",     note: "SpO\u2082 at 94% within acceptable range for COPD patient.",mood: "Neutral", time: "11:30" },
];

const QUICK_ACTIONS = [
  { icon: PillIcon,     title: "Manage Medications",  desc: "Review & update medication schedule",  page: "Medication Updates" as MenuLabel, color: "border-amber-200 hover:border-amber-400 bg-amber-50" },
  { icon: AlertIcon,    title: "Alerts & Emergency",  desc: "View active alerts and emergency info", page: "Vital Records"      as MenuLabel, color: "border-red-200 hover:border-red-400 bg-red-50"     },
  { icon: CalendarIcon, title: "Daily Care Schedule", desc: "View full shift schedule",              page: "Care Schedule"      as MenuLabel, color: "border-sky-200 hover:border-sky-400 bg-sky-50"    },
  { icon: ClipboardIcon,title: "Manage Care Notes",   desc: "Add, review & edit care logs",          page: "Care Notes"         as MenuLabel, color: "border-emerald-200 hover:border-emerald-400 bg-emerald-50" },
];

const EMERGENCY_CONTACTS = [
  { name: "Dr. Priya Nair",    role: "On-Duty Doctor",    phone: "+94 77 123 4567" },
  { name: "Head Nurse Kamani", role: "Charge Nurse",      phone: "+94 77 234 5678" },
  { name: "Emergency Line",    role: "Medical Emergency", phone: "1990"            },
];

// ── Types ─
interface Props {
  onNavigate: (label: MenuLabel) => void;
  onLogShift: () => void;
}

// ── Add Care Note Modal ─
interface AddNoteModalProps {
  onClose: () => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ onClose }) => {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ patient: "", category: "Morning Routine", note: "", mood: "Good" });

  const handleSave = () => {
    if (!form.patient || !form.note) return;
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900">Add Care Note</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 transition"><XIcon /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Patient</label>
            <select
              value={form.patient}
              onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">Select patient…</option>
              {["John Silva", "Anula Wickrama", "Sunil Fernando", "Kamala Mendis", "Mary Perera"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
              >
                {["Morning Routine", "Medication", "Vital Signs", "Physiotherapy", "Evening Routine", "Nutrition"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mood</label>
              <select
                value={form.mood}
                onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option>Good</option>
                <option>Neutral</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Note</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Describe care observations, patient mood, tasks completed…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            {saved ? "✓ Saved!" : "Save Note"}
          </button>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Helper: schedule type chip colors ─
const typeChip: Record<string, string> = {
  Vitals:    "bg-sky-100 text-sky-700",
  Medication:"bg-purple-100 text-purple-700",
  Physio:    "bg-lime-100 text-lime-700",
  Nutrition: "bg-orange-100 text-orange-700",
  Admission: "bg-blue-100 text-blue-700",
};

const moodTone = (m: string) =>
  m === "Good" ? "emerald" as const : m === "Neutral" ? "amber" as const : "red" as const;

// ── Component ──
const DashboardHome: React.FC<Props> = ({ onNavigate }) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const visibleAlerts = ALERTS.filter((a) => !dismissedAlerts.includes(a.id));

  return (
    <div className="space-y-6">

      {/* ── Welcome Hero Strip ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <SparkleIcon /> Morning Shift &bull; Today, Feb 24
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              Welcome back, Caregiver &#x1F44B;
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You have <span className="font-semibold text-slate-800">6 assigned patients</span>,{" "}
              <span className="font-semibold text-amber-600">4 medications due</span>, and{" "}
              <span className="font-semibold text-red-600">2 active alerts</span> today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("Vital Records")}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <HeartIcon className="h-4 w-4" />
              Update Vital Records
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ClipboardIcon className="h-4 w-4" />
              Add Care Note
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              onClick={() => onNavigate(s.page)}
              className={`group relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-xl`} />
              <div className={`inline-grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${s.color} shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className={`text-sm font-semibold ${s.text}`}>{s.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.caption}</p>
              <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${s.text} opacity-0 transition group-hover:opacity-100`}>
                View details <ArrowRightIcon />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Main grid: Schedule + Quick Actions + Emergency ───────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Daily Care Schedule — 2 cols */}
        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Care Schedule</h3>
              <p className="text-xs text-slate-500">Your tasks for today&apos;s shift</p>
            </div>
            <button
              onClick={() => onNavigate("Care Schedule")}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md"
            >
              Full schedule
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {SCHEDULE_TODAY.map((task, i) => (
              <div
                key={i}
                className={[
                  "flex items-center gap-4 px-6 py-4 transition",
                  task.status === "active" ? "bg-emerald-50/60" : "hover:bg-slate-50/60",
                ].join(" ")}
              >
                {/* Time */}
                <div className="flex w-14 shrink-0 flex-col items-center">
                  <span className="text-xs font-bold text-slate-700">{task.time}</span>
                  <ClockIcon className={`mt-0.5 h-3.5 w-3.5 ${task.status === "active" ? "text-emerald-600" : "text-slate-400"}`} />
                </div>

                {/* Status circle */}
                <div className="flex shrink-0 flex-col items-center">
                  <div className={[
                    "h-8 w-8 rounded-full flex items-center justify-center border-2",
                    task.status === "done"    ? "border-emerald-500 bg-emerald-500 text-white" :
                    task.status === "active"  ? "border-emerald-500 bg-white text-emerald-600" :
                                               "border-slate-300 bg-white text-slate-400",
                  ].join(" ")}>
                    {task.status === "done" ? <CheckIcon /> : <ClockIcon />}
                  </div>
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {task.patient}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeChip[task.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {task.type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                      {task.room}
                    </span>
                  </div>
                  <p className={`mt-0.5 text-xs ${task.status === "done" ? "text-slate-400" : "text-slate-600"}`}>
                    {task.task}
                  </p>
                </div>

                {/* Action */}
                {task.status !== "done" && (
                  <button className={[
                    "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    task.status === "active"
                      ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      : "border border-slate-200 bg-white text-slate-700 hover:shadow-md",
                  ].join(" ")}>
                    {task.status === "active" ? "In Progress" : "Start"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Quick Actions + Emergency Panel */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
              <p className="text-xs text-slate-500">Fast navigation for daily tasks</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {QUICK_ACTIONS.map(({ icon: Icon, title, desc, page, color }) => (
                <button
                  key={title}
                  onClick={() => onNavigate(page)}
                  className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${color}`}
                >
                  <Icon className="h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Panel */}
          <div className="rounded-3xl border border-red-200/60 bg-red-50/60 shadow-[0_20px_60px_rgba(2,6,23,0.06)] backdrop-blur-xl overflow-hidden">
            <div className="border-b border-red-100 px-6 py-4 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-600 shadow-sm">
                <PhoneIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">Emergency Contacts</h3>
                <p className="text-[11px] text-red-700">On-duty staff &amp; emergency lines</p>
              </div>
            </div>
            <div className="divide-y divide-red-100/60">
              {EMERGENCY_CONTACTS.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500">{c.role}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                  >
                    <PhoneIcon className="h-3 w-3" />
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Alerts Banner ───────────────────────────────────────────── */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Alerts</h3>
            <button
              onClick={() => onNavigate("Vital Records")}
              className="text-xs font-semibold text-red-600 hover:text-red-700 transition"
            >
              View all vitals &#8594;
            </button>
          </div>
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={[
                "flex items-start justify-between gap-4 rounded-2xl border p-4 transition",
                alert.type === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <AlertIcon className={`mt-0.5 h-5 w-5 shrink-0 ${alert.type === "critical" ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-bold ${alert.type === "critical" ? "text-red-900" : "text-amber-900"}`}>
                      {alert.patient}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${alert.type === "critical" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
                      {alert.type === "critical" ? "CRITICAL" : "WARNING"}
                    </span>
                    <span className="text-[11px] text-slate-500">{alert.room} &bull; {alert.time}</span>
                  </div>
                  <p className={`mt-0.5 text-xs ${alert.type === "critical" ? "text-red-700" : "text-amber-700"}`}>
                    {alert.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissedAlerts((d) => [...d, alert.id])}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-white/60 transition"
                aria-label="Dismiss alert"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent Care Notes + Manage ────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Care Notes</h3>
            <p className="text-xs text-slate-500">Recent patient care log entries</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNoteModal(true)}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              + Add Note
            </button>
            <button
              onClick={() => onNavigate("Care Notes")}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md"
            >
              Manage All
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {RECENT_NOTES.map((note) => (
            <div key={note.id} className="flex items-start justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/60">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{note.patient}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {note.category}
                  </span>
                  <Badge tone={moodTone(note.mood)}>Mood: {note.mood}</Badge>
                  <span className="text-[11px] text-slate-400">{note.time}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-1">{note.note}</p>
              </div>
              <button className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:shadow-md">
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60">
          <p className="text-xs text-slate-400">
            Showing 3 of 7 recent entries &bull;{" "}
            <button onClick={() => onNavigate("Care Notes")} className="text-emerald-600 hover:underline font-semibold">
              View all care notes
            </button>
          </p>
        </div>
      </div>

      {/* Add Care Note Modal */}
      {showNoteModal && <AddNoteModal onClose={() => setShowNoteModal(false)} />}
    </div>
  );
};

export default DashboardHome;
