import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getDoctorAppointments } from "../../../../api/appointment/doctor-appointment.api";
import type { Appointment, AppointmentPatient } from "../../../../api/appointment/appointment.types";
import { fmt12, fmtDate, statusColor } from "../../../../api/appointment/appointment.types";
import { createPrescription } from "../../../../api/prescriptions/doctor-prescription.api";
import Badge from "../../common/widgets/Badge";
import TableShell from "../../common/widgets/TableShell";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, cls = "h-4 w-4" }: { d: string; cls?: string }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  close:  "M6 18L18 6M6 6l12 12",
  user:   "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  plus:   "M12 4v16m8-8H4",
  pill:   "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  doc:    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  trash:  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
};

// ─── Prescription form types ──────────────────────────────────────────────────
const FREQ = [
  "Once daily","Twice daily","Three times daily","Four times daily",
  "Every 6 hours","Every 8 hours","Every 12 hours","PRN (as needed)",
  "Before meals","After meals","With food","At bedtime",
];
interface Med { medicineName: string; dosage: string; frequency: string; durationDays: number; instructions: string }
const EMPTY_MED: Med = { medicineName: "", dosage: "", frequency: FREQ[0], durationDays: 7, instructions: "" };
const inp = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300";
const today = () => new Date().toISOString().slice(0,10);

// ─── Create Prescription Modal ────────────────────────────────────────────────
interface CreateRxModalProps {
  patient: AppointmentPatient;
  appointmentId: string;          // always required — prescriptions created from appointments
  onClose: () => void;
  onSuccess: (msg: string, prescriptionId: string) => void;
}
const CreateRxModal: React.FC<CreateRxModalProps> = ({ patient, appointmentId, onClose, onSuccess }) => {
  const [diagnosis, setDiagnosis]   = useState("");
  const [notes, setNotes]           = useState("");
  const [issuedDate, setIssuedDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [meds, setMeds]             = useState<Med[]>([{ ...EMPTY_MED }]);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  const addMed    = () => setMeds(m => [...m, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMeds(m => m.filter((_,x)=>x!==i));
  const changeMed = (i: number, field: keyof Med, val: string | number) =>
    setMeds(m => m.map((x,idx) => idx===i ? { ...x, [field]: val } : x));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meds.some(m => !m.medicineName.trim() || !m.dosage.trim())) { setErr("Fill in name and dosage for every medicine."); return; }
    setErr(null);
    try {
      setSaving(true);
      const rx = await createPrescription({
        appointmentId,                  // ← link to appointment
        patientId:   patient.id,
        patientName: patient.fullName,
        patientAge:  patient.age,
        diagnosis:   diagnosis.trim() || undefined,
        notes:       notes.trim() || undefined,
        issuedDate,
        validUntil:  validUntil || undefined,
        medicines:   meds.map(m => ({ ...m, durationDays: Number(m.durationDays), instructions: m.instructions || undefined })),
      });
      onSuccess(`Prescription for ${patient.fullName} saved. Appointment marked as completed.`, rx.id);
      onClose();
    } catch (e: any) {
      setErr(e.message || "Failed to save prescription.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 pt-8">
      <button className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <Ico d={I.doc} cls="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Prescription</h2>
              <p className="text-xs text-slate-400">For: <span className="font-semibold text-slate-700">{patient.fullName}</span></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
            <Ico d={I.close} cls="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          {/* Patient info */}
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <p>Patient Name - {patient.fullName}</p>
                <p>Patient Gender - {patient.gender}</p>
                <p>Patient Age - {patient.age} yrs</p>
                <p>Patient Blood Group - ({patient.bloodGroup})</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Issued Date <span className="text-red-400">*</span></label>
                <input type="date" className={inp} value={issuedDate} onChange={e=>setIssuedDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Valid Until</label>
                <input type="date" className={inp} value={validUntil} min={issuedDate} onChange={e=>setValidUntil(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Diagnosis</label>
                <input className={inp} value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="e.g. Acute pharyngitis" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Clinical Notes</label>
                <textarea rows={2} className={`${inp} resize-none`} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional notes…" />
              </div>
            </div>
          </div>

          {/* Medicines */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Medicines ({meds.length})</h3>
              <button type="button" onClick={addMed}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                <Ico d={I.plus} cls="h-3.5 w-3.5" /> Add Medicine
              </button>
            </div>

            {err && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">{err}</div>}

            <div className="space-y-3">
              {meds.map((med, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Ico d={I.pill} cls="h-3.5 w-3.5" /> Medicine {i+1}
                    </span>
                    {meds.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                        <Ico d={I.trash} cls="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Name <span className="text-red-400">*</span></label>
                      <input className={inp} value={med.medicineName} onChange={e=>changeMed(i,"medicineName",e.target.value)} placeholder="e.g. Amoxicillin 500mg" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Dosage <span className="text-red-400">*</span></label>
                      <input className={inp} value={med.dosage} onChange={e=>changeMed(i,"dosage",e.target.value)} placeholder="500 mg" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Duration (days)</label>
                      <input type="number" min={1} max={365} className={inp} value={med.durationDays} onChange={e=>changeMed(i,"durationDays",Number(e.target.value))} required />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Frequency</label>
                      <select className={inp} value={med.frequency} onChange={e=>changeMed(i,"frequency",e.target.value)}>
                        {FREQ.map(f=><option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Instructions</label>
                      <input className={inp} value={med.instructions} onChange={e=>changeMed(i,"instructions",e.target.value)} placeholder="e.g. Take after food" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-5">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 disabled:translate-y-0 transition">
              {saving ? "Saving…" : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Medical Details Modal ────────────────────────────────────────────────────
interface MedModalProps { patient: AppointmentPatient; appointment: Appointment; onClose: () => void }
const MedModal: React.FC<MedModalProps> = ({ patient, appointment, onClose }) => {
  const personal = [
    { label: "Full Name",         value: patient.fullName },
    { label: "NIC",               value: patient.nic },
    { label: "Date of Birth",     value: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("en-GB") : undefined },
    { label: "Gender",            value: patient.gender },
    { label: "Blood Group",       value: patient.bloodGroup },
    { label: "Address",           value: patient.address },
    { label: "Contact",           value: patient.contactNumber },
    { label: "Emergency Contact", value: patient.emergencyContact },
  ];
  const medical = [
    { label: "Medical History",     value: patient.medicalHistory },
    { label: "Allergies",           value: patient.allergies },
    { label: "Current Medications", value: patient.currentMedications },
    { label: "Chronic Conditions",  value: patient.chronicConditions },
  ];
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white"><Ico d={I.user} cls="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{patient.fullName}</p>
              <p className="text-xs text-slate-500">
                {appointment.slot ? `${fmtDate(appointment.slot.date)} · ${fmt12(appointment.slot.startTime)}` : ""}
                {" · "}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusColor[appointment.status]}`}>
                  {appointment.status}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><Ico d={I.close} cls="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
            <div className="grid grid-cols-2 gap-3">
              {personal.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-600">Medical Information</h4>
            <div className="space-y-3">
              {medical.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                  <p className="text-[11px] font-bold text-emerald-600">{label}</p>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{value || <span className="italic text-slate-400">Not recorded</span>}</p>
                </div>
              ))}
            </div>
          </section>
          {appointment.notes && (
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Appointment Notes</h4>
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">{appointment.notes}</div>
            </section>
          )}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Booked By</h4>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{appointment.familyMember?.user?.fullName ?? "—"}</p>
              <p className="text-xs text-slate-400">{appointment.familyMember?.user?.email ?? ""}</p>
            </div>
          </section>
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string }
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
};

// ─── Badge tone ───────────────────────────────────────────────────────────────
type BT = "emerald"|"amber"|"red"|"slate"|"blue";
const tone = (s: string): BT => s==="confirmed"?"emerald":s==="pending"?"amber":s==="cancelled"?"red":s==="completed"?"slate":"blue";

// ─── Main ─────────────────────────────────────────────────────────────────────
type Filter = ""|"pending"|"confirmed"|"completed";

const PatientManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string|null>(null);
  const [filter, setFilter]             = useState<Filter>("");
  const [viewAppt, setViewAppt]         = useState<Appointment|null>(null);
  const [rxAppt, setRxAppt]             = useState<Appointment|null>(null);
  const { toasts, show }                = useToast();

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setAppointments(await getDoctorAppointments()); }
    catch (e: any) { setError(e.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // After prescription created: mark appointment completed + store prescriptionId in state
  const handlePrescriptionCreated = useCallback((msg: string, prescriptionId: string) => {
    show(msg);
    if (rxAppt) {
      setAppointments(prev => prev.map(a =>
        a.id === rxAppt.id
          ? { ...a, status: 'completed' as const, prescriptionId }
          : a
      ));
    }
  }, [rxAppt, show]);

  const filtered = useMemo(() =>
    filter ? appointments.filter(a => a.status === filter) : appointments,
    [appointments, filter]
  );

  const stats = useMemo(() => ({
    total:     appointments.length,
    pending:   appointments.filter(a=>a.status==="pending").length,
    confirmed: appointments.filter(a=>a.status==="confirmed").length,
    completed: appointments.filter(a=>a.status==="completed").length,
  }), [appointments]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
    </div>
  );
  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{error}</p>
      <button onClick={load} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Management</h1>
        <p className="text-sm text-slate-500">All patient appointments assigned to your slots</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label:"Total",     value:stats.total,     color:"slate"   },
          { label:"Pending",   value:stats.pending,   color:"amber"   },
          { label:"Confirmed", value:stats.confirmed, color:"emerald" },
          { label:"Completed", value:stats.completed, color:"blue"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Filter by status:</span>
        {(["","pending","confirmed","completed"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              filter === f ? "bg-emerald-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {f === "" ? "All" : f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <TableShell
        title="Patient Appointments"
        subtitle={`${filtered.length} appointment${filtered.length!==1?"s":""} for your slots`}
      >
        <div className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-slate-600">No appointments found</p>
              <p className="mt-1 text-xs text-slate-400">Patient bookings on your channeling slots will appear here</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Family Member</th>
                  <th className="px-4 py-3">Slot Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prescription</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(appt => {
                  const hasPrescription = !!appt.prescriptionId;
                  return (
                    <tr key={appt.id} className={`transition hover:bg-slate-50/60 ${appt.status==="pending"?"bg-amber-50/30":""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{appt.patient?.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-400">
                          {appt.patient?.age != null
                            ? <span className="font-semibold text-slate-600">{appt.patient.age} yrs</span>
                            : null}
                          {appt.patient?.age != null && appt.patient?.bloodGroup ? " · " : ""}
                          {appt.patient?.bloodGroup
                            ? <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">{appt.patient.bloodGroup}</span>
                            : null}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{appt.familyMember?.user?.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-400">{appt.familyMember?.user?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{appt.slot ? fmtDate(appt.slot.date) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {appt.slot ? `${fmt12(appt.slot.startTime)} – ${fmt12(appt.slot.endTime)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={tone(appt.status)}>
                          {appt.status.charAt(0).toUpperCase()+appt.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {hasPrescription ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                            <Ico d={I.doc} cls="h-3 w-3" /> Prescribed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewAppt(appt)}
                            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                            View
                          </button>
                          {appt.status === "confirmed" && !hasPrescription && (
                            <button onClick={() => setRxAppt(appt)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition">
                              <Ico d={I.doc} cls="h-3.5 w-3.5" /> Prescribe
                            </button>
                          )}
                          {appt.status === "confirmed" && hasPrescription && (
                            <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                              Prescribed ✓
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </TableShell>

      {/* Modals */}
      {viewAppt && <MedModal patient={viewAppt.patient} appointment={viewAppt} onClose={() => setViewAppt(null)} />}
      {rxAppt   && (
        <CreateRxModal
          patient={rxAppt.patient}
          appointmentId={rxAppt.id}
          onClose={() => setRxAppt(null)}
          onSuccess={handlePrescriptionCreated}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            ✓ {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientManagement;
