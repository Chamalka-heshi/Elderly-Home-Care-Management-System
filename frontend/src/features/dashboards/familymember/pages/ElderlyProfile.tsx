import React, { useState, useEffect, useCallback } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge      from "../../common/widgets/Badge";
import {
  patientApi,
  type Patient,
  type CreatePatientPayload,
  type Gender,
} from "../../../../api/patient.api";

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/** Validate NIC: 9 digits + V/X  OR  12 digits */
function isValidNic(nic: string): boolean {
  return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
}

/** Validate phone: exactly 10 digits */
function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreatePatientPayload = {
  fullName:           "",
  nic:                "",
  dateOfBirth:        "",
  gender:             "male" as Gender,
  bloodGroup:         "",
  contactNumber:      "",
  emergencyContact:   "",
  address:            "",
  medicalHistory:     "",
  allergies:          "",
  currentMedications: "",
  chronicConditions:  "",
};

// ── Component ─────────────────────────────────────────────────────────────────

const ElderlyProfile: React.FC = () => {
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState<CreatePatientPayload>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Load patients ───────────────────────────────────────────────────────────

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientApi.getAll();
      setPatients(res.patients);          // backend returns { patients, total }
    } catch (err) {
      showToast((err as Error).message, false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  // ── Toast ───────────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Form handlers ───────────────────────────────────────────────────────────

  const handleField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side validation matching backend DTO rules ──
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!isValidNic(form.nic.trim())) {
      setError("NIC must be 9 digits + V/X (e.g. 123456789V) or 12 digits.");
      return;
    }
    if (!form.dateOfBirth) {
      setError("Date of birth is required.");
      return;
    }
    if (form.contactNumber?.trim() && !isValidPhone(form.contactNumber.trim())) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }
    if (form.emergencyContact?.trim() && !isValidPhone(form.emergencyContact.trim())) {
      setError("Emergency contact must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await patientApi.create(form);
      setPatients((prev) => [res.patient, ...prev]);
      setForm(EMPTY_FORM);
      setShowModal(false);
      showToast(`${res.patient.fullName} successfully added.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = patients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.nic.toLowerCase().includes(search.toLowerCase()) ||
    (p.chronicConditions ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Detail view ─────────────────────────────────────────────────────────────

  if (selected) {
    const age = calcAge(selected.dateOfBirth);
    const details = [
      { label: "NIC",                 value: selected.nic                              },
      { label: "Date of Birth",       value: selected.dateOfBirth                      },
      { label: "Age",                 value: String(age)                               },
      { label: "Gender",              value: selected.gender                           },
      { label: "Blood Group",         value: selected.bloodGroup        ?? "—"         },
      { label: "Contact Number",      value: selected.contactNumber     ?? "—"         },
      { label: "Address",             value: selected.address           ?? "—"         },
      { label: "Emergency Contact",   value: selected.emergencyContact  ?? "—"         },
      { label: "Chronic Conditions",  value: selected.chronicConditions ?? "—"         },
      { label: "Allergies",           value: selected.allergies         ?? "—"         },
      { label: "Current Medications", value: selected.currentMedications ?? "—"        },
      { label: "Status",              value: selected.isActive ? "Active" : "Inactive" },
    ];

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
              {selected.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selected.fullName}</h2>
              <p className="text-sm text-slate-500">Age {age} · DOB {selected.dateOfBirth}</p>
              <div className="mt-1">
                <Badge tone={selected.isActive ? "emerald" : "slate"}>
                  {selected.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {selected.medicalHistory && (
            <div className="mt-4 rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Medical History</p>
              <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line">{selected.medicalHistory}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-xl ${
            toast.ok ? "bg-emerald-600" : "bg-red-500"
          }`}
        >
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2-4.35-4.35" />
          </svg>
          <input
            placeholder="Search by name, NIC or condition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs font-semibold text-slate-400 hover:text-slate-700">
              Clear
            </button>
          )}
        </div>

        <button
          onClick={() => { setForm(EMPTY_FORM); setError(null); setShowModal(true); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Elderly Member
        </button>
      </div>

      <TableShell
        title="Elderly Patients"
        subtitle={loading ? "Loading…" : `${filtered.length} of ${patients.length} patients shown`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">NIC</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Chronic Conditions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Loading patients…
                  </td>
                </tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.nic}</td>
                  <td className="px-4 py-3 text-slate-600">{calcAge(p.dateOfBirth)}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{p.gender}</td>
                  <td className="px-4 py-3 text-slate-600">{p.chronicConditions ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.isActive ? "emerald" : "slate"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
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
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* ── Modal ──────────────────────────────────────────────────────────────── */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white shadow-[0_20px_60px_rgba(2,6,23,0.20)]">

              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Elderly Member</h2>
                  <p className="text-xs text-slate-500">Register a new elderly patient under your family account.</p>
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

              <form onSubmit={handleSubmit} className="space-y-6 p-6">

                {/* Error banner */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {/* ── Personal Information ── */}
                <div>
                  <h3 className="mb-4 text-sm font-bold text-slate-700">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="sm:col-span-2">
                      <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleField}
                        placeholder="e.g. John Silva"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        NIC Number <span className="text-red-500">*</span>
                        <span className="ml-1 font-normal text-slate-400">(9 digits+V/X or 12 digits)</span>
                      </label>
                      <input
                        name="nic"
                        value={form.nic}
                        onChange={handleField}
                        placeholder="e.g. 196812345678 or 681234567V"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={handleField}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Gender</label>
                      <select name="gender" value={form.gender} onChange={handleField} className={inputCls}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Blood Group</label>
                      <select name="bloodGroup" value={form.bloodGroup} onChange={handleField} className={inputCls}>
                        <option value="">— Select —</option>
                        {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>
                        Contact Number
                        <span className="ml-1 font-normal text-slate-400">(10 digits)</span>
                      </label>
                      <input
                        name="contactNumber"
                        value={form.contactNumber}
                        onChange={handleField}
                        placeholder="e.g. 0771234567"
                        maxLength={10}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Emergency Contact
                        <span className="ml-1 font-normal text-slate-400">(10 digits)</span>
                      </label>
                      <input
                        name="emergencyContact"
                        value={form.emergencyContact}
                        onChange={handleField}
                        placeholder="e.g. 0779876543"
                        maxLength={10}
                        className={inputCls}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelCls}>Home Address</label>
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleField}
                        placeholder="Street, City, Province"
                        className={inputCls}
                      />
                    </div>

                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* ── Medical Information ── */}
                <div>
                  <h3 className="mb-4 text-sm font-bold text-slate-700">Medical Information</h3>
                  <div className="grid grid-cols-1 gap-4">

                    <div>
                      <label className={labelCls}>Chronic Conditions</label>
                      <input
                        name="chronicConditions"
                        value={form.chronicConditions}
                        onChange={handleField}
                        placeholder="e.g. Diabetes, Hypertension"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Allergies</label>
                      <input
                        name="allergies"
                        value={form.allergies}
                        onChange={handleField}
                        placeholder="e.g. Penicillin, Peanuts"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Current Medications</label>
                      <input
                        name="currentMedications"
                        value={form.currentMedications}
                        onChange={handleField}
                        placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Medical History</label>
                      <textarea
                        name="medicalHistory"
                        value={form.medicalHistory}
                        onChange={handleField}
                        rows={3}
                        placeholder="Past surgeries, hospitalisations, significant illnesses…"
                        className={inputCls + " resize-none"}
                      />
                    </div>

                  </div>
                </div>

                {/* Footer */}
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
                    {saving ? "Saving…" : "Add Elderly Member"}
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