import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import FormModal, { type FieldConfig } from "../../common/widgets/FormModal";

type Appt = {
  id: string; patient: string; date: string; time: string;
  type: string; location: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "No-Show";
};

const INITIAL: Appt[] = [
  { id: "1", patient: "John Silva",      date: "2026-02-15", time: "09:00", type: "Follow-up",       location: "Room 3",      status: "Scheduled" },
  { id: "2", patient: "Nimal Gunaratne", date: "2026-02-16", time: "10:30", type: "Cardiac Review",  location: "Room 1",      status: "Scheduled" },
  { id: "3", patient: "Sunil Bandara",   date: "2026-02-14", time: "08:00", type: "Monthly Check",   location: "Room 2",      status: "Completed" },
  { id: "4", patient: "Mary Perera",     date: "2026-02-13", time: "14:00", type: "Intake",          location: "Room 4",      status: "Completed" },
  { id: "5", patient: "Sandi Kumari",    date: "2026-02-12", time: "11:00", type: "Consultation",    location: "Room 3",      status: "Cancelled" },
  { id: "6", patient: "Anula Wickrama",  date: "2026-02-17", time: "13:00", type: "Physio Review",   location: "Physio Unit", status: "Scheduled" },
  { id: "7", patient: "Rajan Fernando",  date: "2026-02-11", time: "09:30", type: "Diabetes Check",  location: "Room 2",      status: "No-Show"   },
];

const FIELDS: FieldConfig[] = [
  { name: "patient",  label: "Patient",  required: true, options: [
    { value: "John Silva", label: "John Silva" }, { value: "Nimal Gunaratne", label: "Nimal Gunaratne" },
    { value: "Sunil Bandara", label: "Sunil Bandara" }, { value: "Anula Wickrama", label: "Anula Wickrama" },
    { value: "Mary Perera", label: "Mary Perera" }, { value: "Rajan Fernando", label: "Rajan Fernando" },
  ]},
  { name: "date",     label: "Date",     required: true, type: "date" },
  { name: "time",     label: "Time",     required: true, type: "time" },
  { name: "type",     label: "Type",     required: true, options: [
    { value: "Follow-up",    label: "Follow-up"    }, { value: "Consultation", label: "Consultation" },
    { value: "Intake",       label: "Intake"       }, { value: "Review",       label: "Review"       },
    { value: "Monthly Check",label: "Monthly Check"},
  ]},
  { name: "location", label: "Location", required: true, options: [
    { value: "Room 1", label: "Room 1" }, { value: "Room 2", label: "Room 2" },
    { value: "Room 3", label: "Room 3" }, { value: "Room 4", label: "Room 4" },
    { value: "Physio Unit", label: "Physio Unit" },
  ]},
];

const statusTone = (s: string) =>
  s === "Scheduled" ? "blue"    as const :
  s === "Completed" ? "emerald" as const :
  s === "Cancelled" ? "red"     as const : "amber" as const;

const Appointments: React.FC = () => {
  const [appts, setAppts] = useState<Appt[]>(INITIAL);
  const [open, setOpen]   = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setAppts((a) => [{
      id:       String(Date.now()),
      patient:  fd.get("patient")  as string,
      date:     fd.get("date")     as string,
      time:     fd.get("time")     as string,
      type:     fd.get("type")     as string,
      location: fd.get("location") as string,
      status: "Scheduled",
    }, ...a]);
    setOpen(false);
  };

  const counts = {
    Scheduled: appts.filter((a) => a.status === "Scheduled").length,
    Completed: appts.filter((a) => a.status === "Completed").length,
    Cancelled: appts.filter((a) => a.status === "Cancelled").length,
    "No-Show": appts.filter((a) => a.status === "No-Show").length,
  };

  return (
    <>
     
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-slate-900">{count}</p>
            <div className="mt-1"><Badge tone={statusTone(label)}>{label}</Badge></div>
          </div>
        ))}
      </div>

      <TableShell
        title="Appointments"
        subtitle="View channeling schedule and upcoming patient appointments."
        right={
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + New Appointment
          </button>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appts.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{a.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{a.date}</td>
                  <td className="px-4 py-3 text-slate-600">{a.time}</td>
                  <td className="px-4 py-3 text-slate-600">{a.type}</td>
                  <td className="px-4 py-3 text-slate-600">{a.location}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "Scheduled" ? (
                      <button
                        onClick={() => setAppts((prev) => prev.map((x) => x.id === a.id ? { ...x, status: "Completed" } : x))}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <FormModal title="New Appointment" open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} fields={FIELDS} />
    </>
  );
};

export default Appointments;
