import React, { useEffect, useMemo, useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";

import {
  getMySlots,
  acceptChannelingSlot,
  rejectChannelingSlot,
  setDoctorAvailability,
} from "../../../../api/channeling/doctor-channeling.api";
import { getProfile } from "../../../../api/auth/auth.api";
import { type ChannelingSlot, fmt12, fmtDate } from "../../../../api/channeling/channeling.types";
import { getDoctorAppointments } from "../../../../api/appointment/doctor-appointment.api";
import type { Appointment } from "../../../../api/appointment/appointment.types";

const DAYS_OF_WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const IconUsers = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-5M9 20H4v-2a4 4 0 015-5m6-4a4 4 0 11-8 0 4 4 0 018 0zM3 8a4 4 0 118 0"/>
  </svg>
);

const ChannelingManager: React.FC = () => {
  const [slots, setSlots]               = useState<ChannelingSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo]     = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [isEditing, setIsEditing]       = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime]       = useState("");
  const [endTime, setEndTime]           = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slotsData, profileData, apptData] = await Promise.all([
        getMySlots(),
        getProfile(),
        getDoctorAppointments().catch(() => [] as Appointment[]),
      ]);
      setSlots(slotsData);
      setDoctorInfo(profileData);
      setAppointments(apptData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Build a map: slotId → count of non-cancelled appointments
  const patientCountBySlot = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const a of appointments) {
      if (a.status !== "cancelled") {
        map[a.slotId] = (map[a.slotId] ?? 0) + 1;
      }
    }
    return map;
  }, [appointments]);

  const profileNode = doctorInfo?.profile || doctorInfo;

  const parsedAvailableDays = useMemo(() => {
    if (!profileNode?.availableDays) return [];
    let raw: any = profileNode.availableDays;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch {}
      try { if (typeof raw === "string") raw = JSON.parse(raw); } catch {}
      if (Array.isArray(raw)) return raw;
      return String(profileNode.availableDays).replace(/[\[\]"'\\]/g,"").split(",").map((s:string)=>s.trim()).filter(Boolean);
    }
    return [];
  }, [profileNode]);

  useEffect(() => {
    if (profileNode) {
      setSelectedDays(parsedAvailableDays);
      setStartTime(profileNode.availableTimeStart || "");
      setEndTime(profileNode.availableTimeEnd || "");
    }
  }, [profileNode, parsedAvailableDays]);

  const hasSetAvailability = parsedAvailableDays.length > 0 || profileNode?.availableTimeStart;
  const toggleDay = (day: string) => setSelectedDays(p => p.includes(day) ? p.filter(d=>d!==day) : [...p, day]);

  const handleSetAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDays.length) return alert("Please select at least one day.");
    try {
      const updated = await setDoctorAvailability({ availableDays: selectedDays, availableTimeStart: startTime, availableTimeEnd: endTime });
      setDoctorInfo(updated);
      setIsEditing(false);
      alert("Availability updated.");
    } catch (err: any) { alert(err.message); }
  };

  const handleAction = async (id: string, action: "accept" | "reject") => {
    try {
      const updated = action === "accept" ? await acceptChannelingSlot(id) : await rejectChannelingSlot(id);
      setSlots(p => p.map(s => s.id === id ? updated : s));
    } catch (err: any) { alert(`Failed to ${action}: ${err.message}`); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Availability panel */}
      {(!hasSetAvailability || isEditing) ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-blue-900">
              {hasSetAvailability ? "Edit Your Availability" : "Set Your Availability"}
            </h2>
            {hasSetAvailability && (
              <button onClick={() => setIsEditing(false)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Cancel</button>
            )}
          </div>
          <p className="text-sm text-blue-700 mb-4">Indicate your preferred working days and times for the Admin.</p>
          <form onSubmit={handleSetAvailability} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Preferred Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button type="button" key={day} onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedDays.includes(day) ? "bg-blue-600 text-white shadow-md" : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-100"}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">Start Time</label>
                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 p-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">End Time</label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 p-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition">
              {hasSetAvailability ? "Update Availability" : "Submit Availability to Admin"}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Registered Availability</p>
            <p className="text-sm font-semibold text-slate-800 mt-1.5 flex items-center gap-2">
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                {parsedAvailableDays.length > 0 ? parsedAvailableDays.join(", ") : "Any day"}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {profileNode.availableTimeStart ? fmt12(profileNode.availableTimeStart) : ""}
                {" — "}
                {profileNode.availableTimeEnd ? fmt12(profileNode.availableTimeEnd) : ""}
              </span>
            </p>
          </div>
          <button onClick={() => setIsEditing(true)} className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            Edit Availability
          </button>
        </div>
      )}

      {/* Assigned slots table */}
      <TableShell title="Assigned Slots" subtitle="Approve or reject slots created by the Admin.">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time Window</th>
                <th className="px-4 py-3">Max Patients</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No slots assigned yet.</td></tr>
              ) : slots.map(s => {
                const booked = patientCountBySlot[s.id] ?? 0;
                return (
                  <tr key={s.id} className={`transition hover:bg-slate-50/60 ${s.status === "pending" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{fmtDate(s.date)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt12(s.startTime)} – {fmt12(s.endTime)}</td>
                    <td className="px-4 py-3 text-slate-600">{s.maxPatients}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        <IconUsers />
                        {booked} / {s.maxPatients}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.status === "pending" ? "amber" : s.status === "active" ? "blue" : s.status === "rejected" ? "red" : "slate"}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAction(s.id, "accept")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm active:scale-95 transition">Accept</button>
                          <button onClick={() => handleAction(s.id, "reject")} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 active:scale-95 transition">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
};

const Appointments: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Channeling Schedule</h1>
      <p className="text-sm text-slate-500">Manage your availability and approve admin-assigned slots</p>
    </div>
    <ChannelingManager />
  </div>
);

export default Appointments;
