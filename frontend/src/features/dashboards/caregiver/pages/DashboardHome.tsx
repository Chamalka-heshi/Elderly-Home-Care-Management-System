import React, { useEffect, useState, useCallback } from "react";
import Badge from "../../common/widgets/Badge";
import type { MenuLabel } from "../components/Sidebar";
import {
  getAssignedPatients,
  getAllVitalRecords,
  getAllMedicationLogs,
  createCareNote,
} from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";
import type { VitalRecord, MedicationLog } from "../../../../api/caregivers/caregiver.api";
import { todayLocal, fmtDayLabel, fmtTime, fmtDate } from '../../../../utils/dateTime';

import iconImg from "../../../../assets/landing/icon.png";
import {
  IconHeart, IconUsers, IconClipboard, IconPill,
  IconAlert, IconCalendar, IconArrowRight,
  IconPhone, IconX,
} from "../../common/icons";

const EMERGENCY_CONTACTS = [
  { name: "Dr. Priya Nair",    role: "On-Duty Doctor",    phone: "+94 77 123 4567" },
  { name: "Head Nurse Kamani", role: "Charge Nurse",      phone: "+94 77 234 5678" },
  { name: "Emergency Line",    role: "Medical Emergency", phone: "1990"            },
];

const QUICK_ACTIONS = [
  { icon: IconPill,      title: "Manage Medications",  desc: "Review & update medication schedule",  page: "Medication Updates" as MenuLabel, color: "border-amber-200 hover:border-amber-400 bg-amber-50"   },
  { icon: IconAlert,     title: "Vital Records",        desc: "Record & review patient vitals",        page: "Vital Records"      as MenuLabel, color: "border-red-200 hover:border-red-400 bg-red-50"         },
  { icon: IconCalendar,  title: "Care Schedule",        desc: "View full shift schedule",              page: "Care Schedule"      as MenuLabel, color: "border-sky-200 hover:border-sky-400 bg-sky-50"          },
  { icon: IconClipboard, title: "All Care Notes",       desc: "Add, review & edit care logs",          page: "Care Notes"         as MenuLabel, color: "border-emerald-200 hover:border-emerald-400 bg-emerald-50" },
];


// ── Add Care Note Modal ───────────────────────────────────────────────────────
interface AddNoteModalProps {
  patients: Patient[];
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["general", "medical", "behavioral"] as const;
const CATEGORY_LABELS: Record<string, string> = { general: "General", medical: "Medical", behavioral: "Behavioral" };

const AddNoteModal: React.FC<AddNoteModalProps> = ({ patients, onClose, onSaved }) => {
  const [form, setForm]     = useState({ residentId: "", category: "general", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.residentId || !form.note.trim()) {
      setError("Please select a patient and enter a note.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCareNote({ residentId: form.residentId, note: form.note, category: form.category });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900">Add Care Note</h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 transition"><IconX className="h-5 w-5" /></button>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Patient *</label>
            <select required value={form.residentId} onChange={(e) => setForm((f) => ({ ...f, residentId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10">
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Note *</label>
            <textarea rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Describe care observations, patient mood, tasks completed…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10" />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save Note"}
          </button>
          <button onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:shadow-md">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  onNavigate: (label: MenuLabel) => void;
  onLogShift: () => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate }) => {
  const [patients,   setPatients]   = useState<Patient[]>([]);
  const [vitals,     setVitals]     = useState<VitalRecord[]>([]);
  const [medLogs,    setMedLogs]    = useState<MedicationLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [noteRefresh, setNoteRefresh] = useState(0);    // increment to re-fetch notes
  const [showModal,  setShowModal]  = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Load all dashboard data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAssignedPatients(),
      getAllVitalRecords(),
      getAllMedicationLogs(),
    ])
      .then(([pRes, vRes, mRes]) => {
        setPatients(pRes.patients);
        setVitals(vRes);
        setMedLogs(mRes);
      })
      .finally(() => setLoading(false));
  }, [noteRefresh]);

  const handleNoteSaved = useCallback(() => setNoteRefresh((n) => n + 1), []);

  // ── Derived stats ──
  const today = todayLocal();
  const isTodayLog = (m: MedicationLog) =>
    !m.scheduledDate || m.scheduledDate === today || (m.createdAt && m.createdAt.slice(0, 10) === today);

  const pendingMeds   = medLogs.filter((m) => m.status === "Pending" && isTodayLog(m)).length;
  const administeredMeds = medLogs.filter((m) => m.status === "Administered" && isTodayLog(m)).length;
  const criticalVitals = vitals.filter((v) => v.status === "Critical").length;
  const warningVitals  = vitals.filter((v) => v.status === "Warning").length;

  // Recent alerts from critical/warning vitals (up to 3 most recent)
  const alertVitals = vitals
    .filter((v) => v.status === "Critical" || v.status === "Warning")
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 3)
    .filter((v) => !dismissedAlerts.includes(v.id));

  const patientName = (id: string) => patients.find((p) => p.id === id)?.fullName ?? "Unknown Patient";

  const STATS = [
    {
      title: "Assigned Patients", value: loading ? "—" : patients.length,
      caption: patients.length > 0 ? `${patients.filter(p => p.isActive).length} active · ${patients.filter(p => !p.isActive).length} inactive` : "No patients yet",
      icon: IconUsers, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", page: "Assigned Patients" as MenuLabel,
    },
    {
      title: "Medications Due Today", value: loading ? "—" : pendingMeds,
      caption: `${administeredMeds} administered · ${pendingMeds} pending`,
      icon: IconPill, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", page: "Medication Updates" as MenuLabel,
    },
    {
      title: "Vital Alerts", value: loading ? "—" : criticalVitals + warningVitals,
      caption: `${criticalVitals} critical · ${warningVitals} warning`,
      icon: IconAlert, color: "from-red-500 to-rose-600", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", page: "Vital Records" as MenuLabel,
    },
    {
      title: "Total Vitals Logged", value: loading ? "—" : vitals.length,
      caption: `${vitals.filter(v => v.status === "Normal").length} normal readings`,
      icon: IconHeart, color: "from-sky-500 to-blue-600", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", page: "Vital Records" as MenuLabel,
    },
  ];

  const todayLabel = fmtDayLabel();

  return (
    <div className="space-y-6">

      {/* ── Welcome Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <img src={iconImg} alt="Care Home Logo" className="h-4 w-4 object-contain" /> {todayLabel}
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              Welcome back, Caregiver 👋
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              You have{" "}
              <span className="font-semibold text-slate-800">{loading ? "…" : patients.length} assigned patient{patients.length !== 1 ? "s" : ""}</span>,{" "}
              <span className="font-semibold text-amber-600">{loading ? "…" : pendingMeds} medication{pendingMeds !== 1 ? "s" : ""} pending</span>, and{" "}
              <span className="font-semibold text-red-600">{loading ? "…" : criticalVitals + warningVitals} vital alert{criticalVitals + warningVitals !== 1 ? "s" : ""}</span> today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate("Vital Records")}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
              <IconHeart className="h-4 w-4" /> Update Vital Records
            </button>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <IconClipboard className="h-4 w-4" /> Add Care Note
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.title} onClick={() => onNavigate(s.page)}
              className={`group relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}>
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-xl`} />
              <div className={`inline-grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${s.color} shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className={`text-sm font-semibold ${s.text}`}>{s.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.caption}</p>
              <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${s.text} opacity-0 transition group-hover:opacity-100`}>
                <IconArrowRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Vital Alerts ─────────────────────────────────────────────────── */}
      {alertVitals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Vital Alerts</h3>
            <button onClick={() => onNavigate("Vital Records")} className="text-xs font-semibold text-red-600 hover:text-red-700 transition">
              View all vitals →
            </button>
          </div>
          {alertVitals.map((v) => (
            <div key={v.id}
              className={["flex items-start justify-between gap-4 rounded-2xl border p-4 transition",
                v.status === "Critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"].join(" ")}>
              <div className="flex items-start gap-3">
                <IconAlert className={`mt-0.5 h-5 w-5 shrink-0 ${v.status === "Critical" ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-bold ${v.status === "Critical" ? "text-red-900" : "text-amber-900"}`}>
                      {patientName(v.patientId)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.status === "Critical" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
                      {v.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-500">{fmtTime(v.recordedAt)}</span>
                  </div>
                  <p className={`mt-0.5 text-xs ${v.status === "Critical" ? "text-red-700" : "text-amber-700"}`}>
                    BP: {v.bloodPressure ?? "—"} · HR: {v.heartRate ? `${v.heartRate} bpm` : "—"} · SpO₂: {v.oxygenSaturation ? `${v.oxygenSaturation}%` : "—"} · Temp: {v.temperature ? `${v.temperature}°C` : "—"}
                  </p>
                </div>
              </div>
              <button onClick={() => setDismissedAlerts((d) => [...d, v.id])}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-white/60 transition" aria-label="Dismiss">
                <IconX className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Grid: Quick Actions + Patients + Emergency ──────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Assigned Patients overview — 2 cols */}
        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assigned Patients</h3>
              <p className="text-xs text-slate-500">Patients on an active payment plan</p>
            </div>
            <button onClick={() => onNavigate("Assigned Patients")}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md">
              View all
            </button>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">Loading patients…</div>
          ) : patients.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No patients with an active plan yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {patients.slice(0, 6).map((p) => {
                const patientVitals = vitals.filter((v) => v.patientId === p.id);
                const latestVital   = patientVitals[0];
                return (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50/60">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {p.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{p.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{p.chronicConditions ?? "No conditions recorded"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {latestVital ? (
                        <>
                          <Badge tone={latestVital.status === "Normal" ? "emerald" : latestVital.status === "Warning" ? "amber" : "red"}>
                            {latestVital.status}
                          </Badge>
                          <p className="mt-0.5 text-[11px] text-slate-400">Last vitals: {fmtDate(latestVital.recordedAt)}</p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">No vitals yet</span>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Quick Actions + Emergency */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
              <p className="text-xs text-slate-500">Fast navigation for daily tasks</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {QUICK_ACTIONS.map(({ icon: Icon, title, desc, page, color }) => (
                <button key={title} onClick={() => onNavigate(page)}
                  className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${color}`}>
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
                <IconPhone className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">Emergency Contacts</h3>
                <p className="text-[11px] text-red-700">On-duty staff & emergency lines</p>
              </div>
            </div>
            <div className="divide-y divide-red-100/60">
              {EMERGENCY_CONTACTS.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500">{c.role}</p>
                  </div>
                  <a href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700">
                    <IconPhone className="h-3 w-3" /> {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Medication Logs ────────────────────────────────────────── */}
      {medLogs.filter(isTodayLog).length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Medications</h3>
              <p className="text-xs text-slate-500">Scheduled for {todayLabel}</p>
            </div>
            <button onClick={() => onNavigate("Medication Updates")}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:shadow-md">
              Manage All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {medLogs.filter(isTodayLog).slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/60">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{patientName(m.patientId)}</p>
                    <span className="text-xs text-slate-500">{m.medicationName}</span>
                    {m.dosage && <span className="text-xs text-slate-400">· {m.dosage}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{m.scheduledTime ? `Scheduled: ${m.scheduledTime}` : (m.frequency ?? "Daily")}{m.notes ? ` · ${m.notes}` : ""}</p>
                </div>
                <Badge tone={m.status === "Administered" ? "emerald" : m.status === "Pending" ? "amber" : m.status === "Missed" ? "red" : "slate"}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Care Note Modal */}
      {showModal && (
        <AddNoteModal
          patients={patients}
          onClose={() => setShowModal(false)}
          onSaved={handleNoteSaved}
        />
      )}
    </div>
  );
};

export default DashboardHome;
