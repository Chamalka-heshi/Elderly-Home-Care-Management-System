
import React, { useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import Badge from "../../common/widgets/Badge";
import FormModal, { type FieldConfig } from "../../common/widgets/FormModal";

type Report = {
  id: string; patient: string; type: string; date: string;
  summary: string; status: "Final" | "Draft" | "Pending Review";
};

const INITIAL_REPORTS: Report[] = [
  { id: "1", patient: "John Silva",      type: "Post-Op Review",     date: "2026-02-01", summary: "Recovery progressing well, wound healing normally.",   status: "Final"          },
  { id: "2", patient: "Nimal Gunaratne", type: "Cardiac Assessment",  date: "2026-01-30", summary: "ECG stable, medication dosage adjusted.",             status: "Final"          },
  { id: "3", patient: "Sunil Bandara",   type: "Monthly Check",       date: "2026-02-10", summary: "Blood pressure slightly elevated, monitoring required.", status: "Draft"        },
  { id: "4", patient: "Mary Perera",     type: "Intake Assessment",   date: "2026-02-05", summary: "Initial intake pending lab results.",                 status: "Pending Review" },
];

const FIELDS: FieldConfig[] = [
  { name: "patient", label: "Patient", required: true, options: [
    { value: "John Silva",      label: "John Silva"      },
    { value: "Nimal Gunaratne", label: "Nimal Gunaratne" },
    { value: "Sunil Bandara",   label: "Sunil Bandara"   },
    { value: "Mary Perera",     label: "Mary Perera"     },
  ]},
  { name: "type",    label: "Report Type", required: true, placeholder: "e.g. Monthly Check" },
  { name: "summary", label: "Summary",     required: true, placeholder: "Brief clinical summary…", textarea: true },
  { name: "status",  label: "Status",      required: true, options: [
    { value: "Draft",          label: "Draft"          },
    { value: "Pending Review", label: "Pending Review" },
    { value: "Final",          label: "Final"          },
  ]},
];

const statusTone = (s: string) =>
  s === "Final" ? "emerald" as const : s === "Draft" ? "slate" as const : "amber" as const;

const MedicalReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [open, setOpen]       = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setReports((r) => [{
      id:      String(Date.now()),
      patient: fd.get("patient") as string,
      type:    fd.get("type")    as string,
      date:    new Date().toISOString().slice(0, 10),
      summary: fd.get("summary") as string,
      status:  fd.get("status")  as Report["status"],
    }, ...r]);
    setOpen(false);
  };

  return (
    <>
      <TableShell
        title="Medical Reports"
        subtitle="Create and update patient medical reports."
        right={
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700">
            + New Report
          </button>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Report Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{r.type}</td>
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    <span className="line-clamp-2">{r.summary}</span>
                  </td>
                  <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      <FormModal title="New Medical Report" open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} fields={FIELDS} />
    </>
  );
};

export default MedicalReports;
