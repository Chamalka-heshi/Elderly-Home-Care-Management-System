/**
 * src/features/dashboards/familymember/pages/ElderlyProfile.tsx
 * Mirrors doctor PatientManagement — family member views their linked elderly patients.
 * Includes "Add Elderly Member" modal form.
 */

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

// ── Types ─────────────────────────────────────────────────────────────────────
type Patient = {
  id: string;
  name: string;
  family: string;
  admitted: string;
  condition: string;
  status: "Active" | "Incoming" | "Discharged";
  age: number;
  doctor: string;
  caregiver: string;
  gender?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
};

// ── Initial data ──────────────────────────────────────────────────────────────
const INITIAL_PATIENTS: Patient[] = [
  { id: "1",  name: "John Silva",     family: "Poorna Danushka", admitted: "2026-02-01", condition: "Post-surgery recovery", status: "Active",     age: 68, doctor: "Dr. Perera",  caregiver: "Amali Silva"  },
  { id: "2",  name: "Mary Perera",    family: "Mary Perera",     admitted: "2026-02-05", condition: "Cardiac monitoring",    status: "Incoming",   age: 72, doctor: "Dr. Nimal",   caregiver: "Kasun Jay"    },
  { id: "3",  name: "Kasun Jay",      family: "Mary Perera",     admitted: "2026-01-25", condition: "Fully recovered",       status: "Discharged", age: 55, doctor: "Dr. Suresh",  caregiver: "Niro Perera"  },
  { id: "4",  name: "Anula Wickrama", family: "Poorna Danushka", admitted: "2026-02-10", condition: "Dementia care",         status: "Active",     age: 80, doctor: "Dr. Perera",  caregiver: "Amali Silva"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusTone = (s: string) =>
  s === "Active"     ? "emerald" as const :
  s === "Incoming"   ? "amber"   as const :
  s === "Discharged" ? "slate"   as const : "slate" as const;

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "", age: "", gender: "Male", admitted: "",
  condition: "", status: "Incoming" as Patient["status"],
  doctor: "", caregiver: "", phone: "",
  address: "", emergencyContact: "", notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────
const ElderlyProfile: React.FC = () => {
  const [patients,   setPatients]  = useState<Patient[]>(INITIAL_PATIENTS);
  const [search,     setSearch]    = useState("");
  const [selected,   setSelected]  = useState<Patient | null>(null);
  const [showModal,  setShowModal] = useState(false);
  const [form,       setForm]      = useState(EMPTY_FORM);
  const [saving,     setSaving]    = useState(false);
  const [toast,      setToast]     = useState<string | null>(null);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age || !form.admitted || !form.condition.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const newPatient: Patient = {
      id:               String(Date.now()),
      name:             form.name.trim(),
      age:              Number(form.age),
      gender:           form.gender,
      admitted:         form.admitted,
      condition:        form.condition.trim(),
      status:           form.status,
      doctor:           form.doctor.trim() || "Not assigned",
      caregiver:        form.caregiver.trim() || "Not assigned",
      family:           "You",
      phone:            form.phone.trim(),
      address:          form.address.trim(),
      emergencyContact: form.emergencyContact.trim(),
      notes:            form.notes.trim(),
    };
    setPatients((prev) => [newPatient, ...prev]);
    setForm(EMPTY_FORM);
    setShowModal(false);
    setSaving(false);
    showToast(`${newPatient.name} successfully added.`);
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-md"
        >
          ← Back to list
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.10)] backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-600/25">
              {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
              <p className="text-sm text-slate-500">Age {selected.age} · Admitted {selected.admitted}</p>
              <div className="mt-1"><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Condition",          value: selected.condition            },
              { label: "Assigned Doctor",    value: selected.doctor               },
              { label: "Caregiver",          value: selected.caregiver            },
              { label: "Family Contact",     value: selected.family               },
              { label: "Admission Date",     value: selected.admitted             },
              { label: "Status",             value: selected.status               },
              ...(selected.gender           ? [{ label: "Gender",            value: selected.gender            }] : []),
              ...(selected.phone            ? [{ label: "Phone",             value: selected.phone             }] : []),
              ...(selected.address          ? [{ label: "Address",           value: selected.address           }] : []),
              ...(selected.emergencyContact ? [{ label: "Emergency Contact", value: selected.emergencyContact  }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
          {selected.notes && (
            <div className="mt-4 rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
              <p className="mt-1.5 text-sm text-slate-700">{selected.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-[100] rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl">
          ✓ {toast}
        </div>
      )}

      {/* Search + Add button row */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2-4.35-4.35" />
          </svg>
          <input
            placeholder="Search patients by name or condition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs font-semibold text-slate-400 hover:text-slate-700">Clear</button>
          )}
        </div>

        {/* ── Add Elderly Member button ── */}
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Elderly Member
        </button>
      </div>

      <TableShell
        title="Elderly Profile"
        subtitle={`${filtered.length} of ${patients.length} patients shown`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Admitted</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.age}</td>
                  <td className="px-4 py-3 text-slate-600">{p.admitted}</td>
                  <td className="px-4 py-3 text-slate-600">{p.condition}</td>
                  <td className="px-4 py-3 text-slate-600">{p.doctor}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(p)}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* ── Add Elderly Member Modal ─────────────────────────────────────────── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white shadow-[0_20px_60px_rgba(2,6,23,0.20)]">

              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Elderly Member</h2>
                  <p className="text-xs text-slate-500">Fill in the details to register a new elderly family member.</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6 p-6">

                {/* Personal Info */}
                <div>
                  <h3 className="mb-4 text-sm font-bold text-slate-700">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                      <input name="name" value={form.name} onChange={handleField} placeholder="e.g. John Silva" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Age <span className="text-red-500">*</span></label>
                      <input name="age" type="number" min="50" max="120" value={form.age} onChange={handleField} placeholder="e.g. 72" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select name="gender" value={form.gender} onChange={handleField} className={inputCls}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input name="phone" value={form.phone} onChange={handleField} placeholder="+94 77 000 0000" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Home Address</label>
                      <input name="address" value={form.address} onChange={handleField} placeholder="Street, City, Province" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Emergency Contact</label>
                      <input name="emergencyContact" value={form.emergencyContact} onChange={handleField} placeholder="Name & phone number" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Care Info */}
                <div>
                  <h3 className="mb-4 text-sm font-bold text-slate-700">Care Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Medical Condition <span className="text-red-500">*</span></label>
                      <input name="condition" value={form.condition} onChange={handleField} placeholder="e.g. Dementia care" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Admission Date <span className="text-red-500">*</span></label>
                      <input name="admitted" type="date" value={form.admitted} onChange={handleField} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select name="status" value={form.status} onChange={handleField} className={inputCls}>
                        <option value="Incoming">Incoming</option>
                        <option value="Active">Active</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Assigned Doctor</label>
                      <input name="doctor" value={form.doctor} onChange={handleField} placeholder="e.g. Dr. Perera" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Assigned Caregiver</label>
                      <input name="caregiver" value={form.caregiver} onChange={handleField} placeholder="e.g. Amali Silva" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Additional Notes</label>
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleField}
                        rows={3}
                        placeholder="Any special care requirements or notes…"
                        className={inputCls + " resize-none"}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Adding…" : "Add Elderly Member"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ElderlyProfile;
