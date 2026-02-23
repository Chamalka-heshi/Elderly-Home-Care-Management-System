

import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import FormModal, { type FieldConfig } from "../../common/widgets/FormModal";

type Rx = {
  id: string; patient: string; medication: string; dosage: string;
  frequency: string; startDate: string; endDate: string;
  status: "Active" | "Completed" | "Discontinued";
};

const INITIAL: Rx[] = [
  { id: "1", patient: "John Silva",      medication: "Amoxicillin 500mg",  dosage: "500mg",  frequency: "3× daily", startDate: "2026-02-01", endDate: "2026-02-10", status: "Completed"    },
  { id: "2", patient: "Nimal Gunaratne", medication: "Metoprolol 25mg",    dosage: "25mg",   frequency: "2× daily", startDate: "2026-01-30", endDate: "2026-03-30", status: "Active"       },
  { id: "3", patient: "Sunil Bandara",   medication: "Furosemide 40mg",    dosage: "40mg",   frequency: "1× daily", startDate: "2025-12-20", endDate: "2026-06-20", status: "Active"       },
];

const FIELDS: FieldConfig[] = [
  { name: "patient",    label: "Patient",       required: true, options: [
    { value: "John Silva", label: "John Silva" }, { value: "Nimal Gunaratne", label: "Nimal Gunaratne" },
    { value: "Sunil Bandara", label: "Sunil Bandara" }, { value: "Rajan Fernando", label: "Rajan Fernando" },
    { value: "Anula Wickrama", label: "Anula Wickrama" },
  ]},
  { name: "medication", label: "Medication",    required: true, placeholder: "e.g. Metformin 500mg" },
  { name: "dosage",     label: "Dosage",        required: true, placeholder: "e.g. 500mg" },
  { name: "frequency",  label: "Frequency",     required: true, options: [
    { value: "1× daily", label: "1× daily" }, { value: "2× daily", label: "2× daily" },
    { value: "3× daily", label: "3× daily" }, { value: "PRN", label: "PRN (as needed)" },
  ]},
  { name: "startDate",  label: "Start Date",    required: true, type: "date" },
  { name: "endDate",    label: "End Date",      required: true, type: "date" },
];

const statusTone = (s: string) =>
  s === "Active" ? "emerald" as const : s === "Completed" ? "blue" as const : "red" as const;

const Prescription: React.FC = () => {
  const [rxList, setRxList] = useState<Rx[]>(INITIAL);
  const [open, setOpen]     = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRxList((r) => [{
      id:         String(Date.now()),
      patient:    fd.get("patient")    as string,
      medication: fd.get("medication") as string,
      dosage:     fd.get("dosage")     as string,
      frequency:  fd.get("frequency")  as string,
      startDate:  fd.get("startDate")  as string,
      endDate:    fd.get("endDate")    as string,
      status: "Active",
    }, ...r]);
    setOpen(false);
  };

  const counts = {
    Active:       rxList.filter((r) => r.status === "Active").length,
    Completed:    rxList.filter((r) => r.status === "Completed").length,
    Discontinued: rxList.filter((r) => r.status === "Discontinued").length,
  };

  return (
    <>
      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-extrabold text-slate-900">{count}</p>
            <Badge tone={statusTone(label)}>{label}</Badge>
          </div>
        ))}
      </div>

      <TableShell
        title="Prescriptions"
        subtitle="Create and manage patient prescriptions."
        right={
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + New Prescription
          </button>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Dosage</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rxList.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{r.medication}</td>
                  <td className="px-4 py-3 text-slate-600">{r.dosage}</td>
                  <td className="px-4 py-3 text-slate-600">{r.frequency}</td>
                  <td className="px-4 py-3 text-slate-600">{r.startDate}</td>
                  <td className="px-4 py-3 text-slate-600">{r.endDate}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <FormModal title="New Prescription" open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} fields={FIELDS} />
    </>
  );
};

export default Prescription;
