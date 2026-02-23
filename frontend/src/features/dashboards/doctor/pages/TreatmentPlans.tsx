

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import FormModal, { type FieldConfig } from "../../common/widgets/FormModal";

type Plan = {
  id: string; patient: string; planName: string; startDate: string;
  endDate: string; goals: string; progress: number;
  status: "Active" | "Completed" | "On Hold";
};

const INITIAL: Plan[] = [
  { id: "1", patient: "John Silva",      planName: "Post-Op Rehabilitation",  startDate: "2026-02-01", endDate: "2026-04-01", goals: "Full mobility recovery, wound care",         progress: 45,  status: "Active"    },
  { id: "2", patient: "Nimal Gunaratne", planName: "Cardiac Recovery Plan",   startDate: "2026-01-30", endDate: "2026-07-30", goals: "Reduce cardiac load, lifestyle changes",     progress: 30,  status: "Active"    },
  { id: "3", patient: "Sunil Bandara",   planName: "Long-Term Elderly Care",  startDate: "2025-12-20", endDate: "2026-12-20", goals: "Maintain quality of life, prevent falls",    progress: 60,  status: "Active"    },
];

const FIELDS: FieldConfig[] = [
  { name: "patient",   label: "Patient",    required: true, options: [
    { value: "John Silva", label: "John Silva" }, { value: "Nimal Gunaratne", label: "Nimal Gunaratne" },
    { value: "Sunil Bandara", label: "Sunil Bandara" }, { value: "Rajan Fernando", label: "Rajan Fernando" },
    { value: "Anula Wickrama", label: "Anula Wickrama" },
  ]},
  { name: "planName",  label: "Plan Name",  required: true, placeholder: "e.g. Post-Op Rehabilitation" },
  { name: "startDate", label: "Start Date", required: true, type: "date" },
  { name: "endDate",   label: "End Date",   required: true, type: "date" },
  { name: "goals",     label: "Goals",      required: true, placeholder: "Treatment goals and targets…", textarea: true },
];

const statusTone = (s: string) =>
  s === "Active" ? "emerald" as const : s === "Completed" ? "blue" as const : "amber" as const;

const TreatmentPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL);
  const [open, setOpen]   = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPlans((p) => [{
      id:        String(Date.now()),
      patient:   fd.get("patient")   as string,
      planName:  fd.get("planName")  as string,
      startDate: fd.get("startDate") as string,
      endDate:   fd.get("endDate")   as string,
      goals:     fd.get("goals")     as string,
      progress:  0,
      status:    "Active",
    }, ...p]);
    setOpen(false);
  };

  return (
    <>
      <TableShell
        title="Treatment Plans"
        subtitle="Manage patient treatment plans and track progress."
        right={
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + New Plan
          </button>
        }
      >
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{p.planName}</p>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Patient: <span className="font-semibold text-slate-700">{p.patient}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.startDate} → {p.endDate}</p>
                  <p className="mt-2 text-xs text-slate-600">{p.goals}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">Progress</p>
                    <p className="text-lg font-extrabold text-emerald-600">{p.progress}%</p>
                  </div>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                    Edit
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </TableShell>

      <FormModal title="New Treatment Plan" open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} fields={FIELDS} />
    </>
  );
};

export default TreatmentPlans;
