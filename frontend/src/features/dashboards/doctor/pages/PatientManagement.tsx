import React, { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "../../common/Pagination";

import { getDoctorAppointments } from "../../../../api/appointment/doctor-appointment.api";

import type {
  Appointment,
  AppointmentPatient,
} from "../../../../api/appointment/appointment.types";

import {
  fmt12,
  fmtDate,
  statusColor,
  statusLabel,
} from "../../../../api/appointment/appointment.types";

import Badge from "../../common/widgets/Badge";
import TableShell from "../../common/widgets/TableShell";

import {
  IconUser,
  IconFileText,
  IconX,
  IconUsers,
  IconClock,
  IconCalendar,
  IconSpinner,
} from "../../common/icons";

// MedModal
// Shows patient personal and medical details for an appointment
interface MedModalProps {
  patient: AppointmentPatient;
  appointment: Appointment;
  onClose: () => void;
}

const MedModal: React.FC<MedModalProps> = ({ patient, appointment, onClose }) => {
  const personal = [
    { label: "Full Name", value: patient.fullName },
    { label: "NIC", value: patient.nic },
    { label: "Date of Birth", value: patient.dateOfBirth ? fmtDate(patient.dateOfBirth) : undefined },
    { label: "Gender", value: patient.gender },
    { label: "Blood Group", value: patient.bloodGroup },
    { label: "Address", value: patient.address },
    { label: "Contact", value: patient.contactNumber },
    { label: "Emergency Contact", value: patient.emergencyContact },
  ];
  const medical = [
    { label: "Medical History", value: patient.medicalHistory },
    { label: "Allergies", value: patient.allergies },
    { label: "Current Medications", value: patient.currentMedications },
    { label: "Chronic Conditions", value: patient.chronicConditions },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white"><IconUser className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{patient.fullName}</p>
              <p className="text-xs text-slate-500">
                {appointment.slot ? `${fmtDate(appointment.slot.date)} · ${fmt12(appointment.slot.startTime)}` : ""}
                {" · "}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusColor[appointment.status]}`}>
                  {statusLabel[appointment.status]}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><IconX className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal details like NIC and birth date */}
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

          {/* Health information like allergies and history */}
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

          {/* Family member who made the booking */}
          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Booked By</h4>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{appointment.familyMember?.user?.fullName ?? "—"}</p>
              <p className="text-xs text-slate-400">{appointment.familyMember?.user?.email ?? ""}</p>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

// Visual Tone Helpers

type BT = "emerald" | "amber" | "red" | "slate" | "blue";
const tone = (s: string): BT =>
  s === "prescription_pending" ? "amber" : s === "cancelled" ? "red" : s === "completed" ? "slate" : "blue";

const getEffectiveStatus = (appt: Appointment): Appointment["status"] => {
  if (
    appt.status === "prescription_pending" &&
    !appt.prescriptionId &&
    appt.slot
  ) {
    const slotEnd = new Date(`${appt.slot.date}T${appt.slot.endTime}:00`);
    if (slotEnd < new Date()) return "cancelled";
  }
  return appt.status;
};

type Filter = "" | "prescription_pending" | "completed" | "cancelled";

// PatientManagement
// Main list for doctors to see and filter patient appointments
const PatientManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(""); // Helps filter the list by status
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null); // Controls the details popup
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Loads all doctor appointments from the server
  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setAppointments(await getDoctorAppointments()); }
    catch (e: any) { setError(e.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Apply effective-status override before filtering
  const appointmentsWithEffectiveStatus = useMemo(
    () => appointments.map((a) => ({ ...a, status: getEffectiveStatus(a) })),
    [appointments],
  );

  const filtered = useMemo(
    () =>
      filter
        ? appointmentsWithEffectiveStatus.filter((a) => a.status === filter)
        : appointmentsWithEffectiveStatus,
    [appointmentsWithEffectiveStatus, filter],
  );

  // Reset to first page whenever the filter changes
  useEffect(() => { setCurrentPage(1); }, [filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Counts total, pending, and completed appointments (using effective status)
  const stats = useMemo(() => ({
    total: appointmentsWithEffectiveStatus.length,
    prescriptionPending: appointmentsWithEffectiveStatus.filter((a) => a.status === "prescription_pending").length,
    completed: appointmentsWithEffectiveStatus.filter((a) => a.status === "completed").length,
    cancelled: appointmentsWithEffectiveStatus.filter((a) => a.status === "cancelled").length,
  }), [appointmentsWithEffectiveStatus]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <IconSpinner className="h-10 w-10 text-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{error}</p>
      <button onClick={load} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Management</h1>
        <p className="text-sm text-slate-500">All patient appointments across your channeling slots</p>
      </div>

      {/* Summary of counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "slate", icon: <IconUsers className="h-4 w-4" /> },
          { label: "Pending Prescription", value: stats.prescriptionPending, color: "amber", icon: <IconClock className="h-4 w-4" /> },
          { label: "Completed", value: stats.completed, color: "blue", icon: <IconFileText className="h-4 w-4" /> },
          { label: "Cancelled", value: stats.cancelled, color: "red", icon: <IconX className="h-4 w-4" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex items-center gap-1.5 text-${color}-500 mb-1`}>{icon}<p className="text-xs font-semibold text-slate-500">{label}</p></div>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Filter:</span>
        {(["", "prescription_pending", "completed", "cancelled"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-emerald-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {f === "" ? "All" : f === "prescription_pending" ? "Pending Prescription" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Main list of appointments */}
      <TableShell title="Patient Appointments" subtitle={`${filtered.length} record${filtered.length !== 1 ? "s" : ""} · To prescribe, use the Appointments tab`}>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconUsers className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No appointments found</p>
              <p className="mt-1 text-xs text-slate-400">Patient bookings on your channeling slots appear here</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Family Member</th>
                  <th className="px-4 py-3"><span className="flex items-center gap-1.5"><IconCalendar className="h-3.5 w-3.5" />Slot Date</span></th>
                  <th className="px-4 py-3"><span className="flex items-center gap-1.5"><IconClock className="h-3.5 w-3.5" />Time</span></th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prescription</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((appt) => {
                  const hasPrescription = !!appt.prescriptionId;
                  return (
                    <tr key={appt.id} className={`transition hover:bg-slate-50/60 ${appt.status === "prescription_pending" ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{appt.patient?.fullName ?? "—"}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          {appt.patient?.age != null && <span className="font-semibold text-slate-600">{appt.patient.age} yrs</span>}
                          {appt.patient?.age != null && appt.patient?.bloodGroup ? " · " : ""}
                          {appt.patient?.bloodGroup && (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">{appt.patient.bloodGroup}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 font-medium">{appt.familyMember?.user?.fullName ?? "—"}</p>
                        <p className="text-xs text-slate-400">{appt.familyMember?.user?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{appt.slot ? fmtDate(appt.slot.date) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{appt.slot ? `${fmt12(appt.slot.startTime)} – ${fmt12(appt.slot.endTime)}` : "—"}</td>
                      <td className="px-4 py-3"><Badge tone={tone(appt.status)}>{statusLabel[appt.status]}</Badge></td>
                      <td className="px-4 py-3">
                        {hasPrescription ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            <IconFileText className="h-3 w-3" /> Prescribed
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200">
                            Not Prescribed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setViewAppt(appt)}
                          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              itemLabel="appointments"
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </TableShell>

      {viewAppt && <MedModal patient={viewAppt.patient} appointment={viewAppt} onClose={() => setViewAppt(null)} />}
    </div>
  );
};

export default PatientManagement;