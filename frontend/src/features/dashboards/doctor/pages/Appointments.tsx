import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  getDoctorAppointments,
  type Appointment,
} from "../../../../api/appointment/doctor-appointment.api";

import {
  fmt12,
  fmtDate,
} from "../../../../api/appointment/appointment.types";
import { fmtMonthShort } from '../../../../utils/dateTime';

import {
  IconActivity,
  IconAlertCircle,
  IconBan,
  IconCalendar,
  IconCheckCircle,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconFileText,
  IconSpinner,
  IconUser,
} from "../../common/icons";

import { PrescribeModal } from "./PrescribeModal";
import { MedicalHistoryModal } from "./MedicalHistoryModal";

// Helper for displaying notifications
interface Toast { id: number; msg: string; kind: "success" | "error" }

// Shows temporary messages to tell the doctor if their action worked or failed
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((msg: string, kind: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return { toasts, add };
};

// Component for displaying a group of appointments
interface SlotGroup {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  appointments: Appointment[];
}

interface SlotCardProps {
  group: SlotGroup;
  onPrescribe: (appt: Appointment) => void;
  onViewHistory: (appt: Appointment) => void;
}

// SlotCard
// Displays a time slot and all patient appointments within it
const SlotCard: React.FC<SlotCardProps> = ({
  group,
  onPrescribe,
  onViewHistory,
}) => {
  const [expanded, setExpanded] = useState(true);
  const total = group.appointments.length;
  const isPast = new Date(`${group.date}T${group.endTime}:00`) < new Date();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-600 text-white px-3 py-2 min-w-[52px]">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {fmtMonthShort(group.date + "T00:00:00")}
            </span>
            <span className="text-xl font-extrabold leading-tight">
              {new Date(group.date + "T00:00:00").getDate()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{fmtDate(group.date)}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <IconClock className="h-3.5 w-3.5" />
              {fmt12(group.startTime)} – {fmt12(group.endTime)}
              {isPast && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Past
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            {total} patient{total !== 1 ? "s" : ""}
          </span>
          {expanded
            ? <IconChevronUp className="h-4 w-4 text-slate-400" />
            : <IconChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {group.appointments.map((appt, idx) => {
            const prescribed = !!appt.prescriptionId || appt.status === "completed";
            const isCancelled = appt.status === "cancelled";
            const slotExpired = appt.slot?.status === "completed" || isPast;

            return (
              <div
                key={appt.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 ${idx < group.appointments.length - 1 ? "border-b border-slate-100" : ""
                  } hover:bg-slate-50/60 transition`}
              >
                {/* Patient info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100">
                    <IconUser className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {appt.patient?.fullName ?? "—"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                      {appt.patient?.age != null && (
                        <span className="font-medium text-slate-600">{appt.patient.age} yrs</span>
                      )}
                      {appt.patient?.gender && (
                        <><span className="text-slate-300">·</span><span>{appt.patient.gender}</span></>
                      )}
                      {appt.patient?.bloodGroup && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-100">
                            {appt.patient.bloodGroup}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Booked-by info */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Booked by</p>
                  <p className="text-sm text-slate-700 truncate">{appt.familyMember?.user?.fullName ?? "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{appt.familyMember?.user?.email ?? ""}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onViewHistory(appt)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 active:scale-95 transition"
                  >
                    <IconActivity className="h-3.5 w-3.5" />
                    Medical History
                  </button>

                  {prescribed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <IconCheckCircle className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : isCancelled || slotExpired ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                      <IconBan className="h-3.5 w-3.5" /> Cancelled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPrescribe(appt)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                    >
                      <IconFileText className="h-3.5 w-3.5" />
                      Prescribe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// DoctorAppointments
// Main page for doctors to see their scheduled appointments
const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescribeAppt, setPrescribeAppt] = useState<Appointment | null>(null);
  const [historyAppt, setHistoryAppt] = useState<Appointment | null>(null);

  const { toasts, add: addToast } = useToast();

  // Loads appointments from the server
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAppointments(await getDoctorAppointments());
    } catch (e: any) {
      setError(e.message ?? "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Groups appointments by their time slot and sorts them by date
  const slotGroups = useMemo<SlotGroup[]>(() => {
    const map = new Map<string, SlotGroup>();
    for (const appt of appointments) {
      const sid = appt.slotId;
      if (!map.has(sid)) {
        map.set(sid, {
          slotId: sid,
          date: appt.slot?.date ?? "",
          startTime: appt.slot?.startTime ?? "",
          endTime: appt.slot?.endTime ?? "",
          appointments: [],
        });
      }
      map.get(sid)!.appointments.push(appt);
    }
    return Array.from(map.values()).sort((a, b) =>
      `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
    );
  }, [appointments]);

  // Splits slots into upcoming and past categories.
  // A past slot is hidden when:
  //   - The channeling slot itself is marked "completed" (already handled), OR
  //   - Every appointment in the slot is effectively cancelled — meaning the slot
  //     time has passed and no prescription was ever issued (nothing left to action).
  const { upcomingGroups, pastGroups } = useMemo(() => {
    const now = new Date();
    return {
      upcomingGroups: slotGroups.filter((g) => new Date(`${g.date}T${g.endTime}:00`) >= now),
      pastGroups: slotGroups.filter((g) => {
        if (new Date(`${g.date}T${g.endTime}:00`) >= now) return false;

        // Hide if slot is completed in the backend
        if (g.appointments.some((a) => a.slot?.status === "completed")) return false;

        // Hide if every appointment is effectively cancelled
        // (past time + no prescription = nothing the doctor can do)
        const allEffectivelyCancelled = g.appointments.every(
          (a) =>
            a.status === "cancelled" ||
            (a.status === "prescription_pending" && !a.prescriptionId),
        );
        if (allEffectivelyCancelled) return false;

        return true;
      }),
    };
  }, [slotGroups]);

  // Updates the list after a prescription is saved
  const handlePrescriptionCreated = useCallback(
    (prescriptionId: string, appointmentId: string) => {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, status: "completed" as const, prescriptionId }
            : a,
        ),
      );
      addToast("Prescription saved. Appointment marked as completed.", "success");
    },
    [addToast],
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <IconSpinner className="h-10 w-10 text-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{error}</p>
      <button
        onClick={load}
        className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-7">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Patient bookings grouped by slot — prescribe to complete appointments
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Slots</p>
          <p className="text-2xl font-extrabold text-slate-700">{upcomingGroups.length}</p>
        </div>
      </div>

      {/* Empty state — shown only when there are no upcoming slots */}
      {upcomingGroups.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <IconActivity className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No appointments yet</p>
          <p className="mt-1 text-xs text-slate-400">Patient bookings will appear here, grouped by slot</p>
        </div>
      )}

      {/* Upcoming */}
      {upcomingGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Upcoming · {upcomingGroups.length} slot{upcomingGroups.length !== 1 ? "s" : ""}
            </h2>
          </div>
          {upcomingGroups.map((group) => (
            <SlotCard
              key={group.slotId}
              group={group}
              onPrescribe={setPrescribeAppt}
              onViewHistory={setHistoryAppt}
            />
          ))}
        </section>
      )}

      {/* Past */}
      {pastGroups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconClock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Past · {pastGroups.length} slot{pastGroups.length !== 1 ? "s" : ""}
            </h2>
          </div>
          {pastGroups.map((group) => (
            <SlotCard
              key={group.slotId}
              group={group}
              onPrescribe={setPrescribeAppt}
              onViewHistory={setHistoryAppt}
            />
          ))}
        </section>
      )}

      {/* Modals */}
      {prescribeAppt && (
        <PrescribeModal
          appointment={prescribeAppt}
          onClose={() => setPrescribeAppt(null)}
          onSuccess={handlePrescriptionCreated}
        />
      )}
      {historyAppt && (
        <MedicalHistoryModal
          patientId={historyAppt.patientId}
          patientName={historyAppt.patient?.fullName ?? "Patient"}
          onClose={() => setHistoryAppt(null)}
        />
      )}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${t.kind === "success" ? "bg-emerald-600" : "bg-red-600"
              }`}
          >
            {t.kind === "success"
              ? <IconCheckCircle className="h-4 w-4 shrink-0" />
              : <IconAlertCircle className="h-4 w-4 shrink-0" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointments;