import React, { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "../../common/Pagination";
import { fmtDateTime } from '../../../../utils/dateTime';
import { getAllAppointmentsAdmin } from "../../../../api/appointment/admin-appointment.api";
import type { Appointment, AppointmentStatus } from "../../../../api/appointment/appointment.types";
import {
  fmt12,
  fmtDate,
  getEffectiveAppointmentStatus,
  statusColor,
  statusLabel,
} from "../../../../api/appointment/appointment.types";
import { IconCalendar, IconFilter, IconUser, IconPrescription, IconX, IconRefresh } from "../../common/icons";

// StatusBadge
// Shows the current status of the appointment with a colored dot
const StatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusColor[status]}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === "payment_pending" ? "bg-blue-400 animate-pulse" :
        status === "prescription_pending" ? "bg-amber-400 animate-pulse" :
          status === "completed" ? "bg-slate-400" : "bg-red-400"
      }`} />
    {statusLabel[status]}
  </span>
);

// PrescriptionBadge
// Shows if a prescription has been issued yet
const PrescriptionBadge: React.FC<{ prescriptionId: string | null }> = ({ prescriptionId }) =>
  prescriptionId ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">
      <IconPrescription className="h-2.5 w-2.5" />
      Rx Issued
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-100">
      No Rx
    </span>
  );

// DetailDrawer
// A side panel that opens to show more details about a specific appointment
const DetailDrawer: React.FC<{ appt: Appointment; onClose: () => void }> = ({ appt, onClose }) => (
  <div
    className="fixed inset-0 z-[90] flex items-center justify-end bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="flex h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with close button */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
        <h3 className="text-sm font-bold text-slate-800">Appointment Details</h3>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appt.status} />
          <PrescriptionBadge prescriptionId={appt.prescriptionId} />
        </div>

        {/* Patient information */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</p>
          <p className="mt-1.5 text-sm font-bold text-slate-800">{appt.patient?.fullName ?? "—"}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {appt.patient?.gender && <span>{appt.patient.gender}</span>}
            {appt.patient?.bloodGroup && <span>Blood: {appt.patient.bloodGroup}</span>}
            {appt.patient?.age && <span>Age: {appt.patient.age}</span>}
            {appt.patient?.contactNumber && <span>📞 {appt.patient.contactNumber}</span>}
          </div>
        </div>

        {/* Doctor and time details */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctor & Schedule</p>
          <p className="mt-1.5 text-sm font-bold text-slate-800">{appt.slot?.doctor?.user?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-500">{appt.slot?.doctor?.specialization ?? ""}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <IconCalendar />
            <span className="font-medium">{appt.slot ? fmtDate(appt.slot.date) : "—"}</span>
            {appt.slot && <><span>·</span><span>{fmt12(appt.slot.startTime)} – {fmt12(appt.slot.endTime)}</span></>}
          </div>
          {(appt.slot?.consultationFee != null || appt.slot?.careHomeFee != null) && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {appt.slot?.consultationFee != null && (
                <div className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Consultation: LKR {Number(appt.slot.consultationFee).toLocaleString()}
                </div>
              )}
              {appt.slot?.careHomeFee != null && (
                <div className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Care-home: LKR {Number(appt.slot.careHomeFee).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Family member who booked the appointment */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requested By</p>
          <p className="mt-1.5 text-sm font-bold text-slate-800">{appt.familyMember?.user?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-500">{appt.familyMember?.user?.email ?? ""}</p>
        </div>

        {/* Special notes from the patient or doctor */}
        {appt.notes && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Notes</p>
            <p className="mt-1 text-xs text-slate-700">{appt.notes}</p>
          </div>
        )}

        {/* Record history and IDs */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-400">Last Updated</p>
            <p>{fmtDateTime(appt.updatedAt)}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-slate-400">Appointment ID</p>
            <p className="break-all font-mono text-[10px]">{appt.id}</p>
          </div>
          {appt.prescriptionId && (
            <div className="col-span-2">
              <p className="font-semibold text-slate-400">Prescription ID</p>
              <p className="break-all font-mono text-[10px] text-violet-700">{appt.prescriptionId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

interface Props {
  addToast: (kind: "success" | "error", message: string) => void;
}

// AppointmentManagement
// Main page for admins to view and filter all appointments in the system
const AppointmentManagement: React.FC<Props> = ({ addToast }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"" | AppointmentStatus>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Loads appointments from the server based on the selected filter
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllAppointmentsAdmin(filterStatus ? { status: filterStatus } : undefined);
      setAppointments(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, addToast]);

  useEffect(() => { load(); }, [load]);

  // Reset to first page whenever the filter changes
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  const effectiveAppointments = useMemo(
    () => appointments.map((appt) => ({ ...appt, status: getEffectiveAppointmentStatus(appt) })),
    [appointments],
  );

  // Counts how many appointments are in each status for the summary boxes
  const stats = useMemo(() => ({
    total: effectiveAppointments.length,
    paymentPending: effectiveAppointments.filter((a) => a.status === "payment_pending").length,
    prescriptionPending: effectiveAppointments.filter((a) => a.status === "prescription_pending").length,
    completed: effectiveAppointments.filter((a) => a.status === "completed").length,
    cancelled: effectiveAppointments.filter((a) => a.status === "cancelled").length,
  }), [effectiveAppointments]);

  // Reset to page 1 whenever the filter changes
  const filteredAppointments = useMemo(
    () => (filterStatus ? effectiveAppointments.filter((a) => a.status === filterStatus) : effectiveAppointments),
    [effectiveAppointments, filterStatus],
  );
  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);
  const paginated = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">

      {/* Page Title and Refresh button */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full history of all patient appointments — track payment, confirmation, and prescription status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <IconFilter /> Filters {showFilters ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Summary boxes with numbers for each status */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {([
          { label: "Total", value: stats.total, dot: "bg-slate-400", text: "text-slate-700" },
          { label: "Awaiting Payment", value: stats.paymentPending, dot: "bg-blue-400", text: "text-blue-600" },
          { label: "Pending Prescription", value: stats.prescriptionPending, dot: "bg-amber-400", text: "text-amber-600" },
          { label: "Completed", value: stats.completed, dot: "bg-slate-300", text: "text-slate-500" },
          { label: "Cancelled", value: stats.cancelled, dot: "bg-red-400", text: "text-red-600" },
        ] as const).map(({ label, value, dot, text }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <p className="truncate text-[10px] font-semibold text-slate-500">{label}</p>
            </div>
            <p className={`mt-1 text-2xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter controls */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "" | AppointmentStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="">All Statuses</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="prescription_pending">Prescription Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Main appointment table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-800">
            All Appointments
          </h3>
          <p className="text-xs text-slate-500">{filteredAppointments.length} records · Click a row to view full details</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
              <IconCalendar />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">No appointments found</p>
            <p className="mt-1 text-xs text-slate-400">All patient appointments will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Requested By</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Fees (LKR)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Prescription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => setSelected(appt)}
                    className={`cursor-pointer transition hover:bg-emerald-50/40 ${appt.status === "payment_pending" ? "bg-blue-50/20" : appt.status === "prescription_pending" ? "bg-amber-50/20" : ""
                      }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                          <IconUser />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{appt.patient?.fullName ?? "—"}</p>
                          <p className="text-xs text-slate-400">
                            {appt.patient?.gender ?? ""}{appt.patient?.bloodGroup ? ` · ${appt.patient.bloodGroup}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700">{appt.familyMember?.user?.fullName ?? "—"}</p>
                      <p className="text-xs text-slate-400">{appt.familyMember?.user?.email ?? ""}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700">{appt.slot?.doctor?.user?.fullName ?? "—"}</p>
                      <p className="text-xs text-slate-400">{appt.slot?.doctor?.specialization ?? ""}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-700">{appt.slot ? fmtDate(appt.slot.date) : "—"}</p>
                      <p className="text-xs text-slate-400">
                        {appt.slot ? `${fmt12(appt.slot.startTime)} – ${fmt12(appt.slot.endTime)}` : ""}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5 text-xs">
                        {appt.slot?.consultationFee != null ? (
                          <p className="font-semibold text-slate-700">
                            {Number(appt.slot.consultationFee).toLocaleString()}
                            <span className="ml-1 font-normal text-slate-400">consult</span>
                          </p>
                        ) : null}
                        {appt.slot?.careHomeFee != null ? (
                          <p className="text-blue-600">
                            +{Number(appt.slot.careHomeFee).toLocaleString()}
                            <span className="ml-1 text-slate-400">care</span>
                          </p>
                        ) : null}
                        {appt.slot?.consultationFee == null && appt.slot?.careHomeFee == null && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <PrescriptionBadge prescriptionId={appt.prescriptionId} />
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
            totalItems={filteredAppointments.length}
              pageSize={PAGE_SIZE}
              itemLabel="appointments"
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {selected && <DetailDrawer appt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AppointmentManagement;