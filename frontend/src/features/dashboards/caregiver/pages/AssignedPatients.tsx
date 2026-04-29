import React, { useEffect, useState } from "react";
import TableShell from "../../common/widgets/TableShell";
import { getAssignedPatients } from "../../../../api/caregivers/caregiver.api";
import type { Patient } from "../../../../api/patients/patient.types";

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

/** Derive a display label + colour from the raw plan string. */
function planBadge(plan?: string): { label: string; className: string } {
  if (!plan) return { label: "Unknown", className: "bg-slate-100 text-slate-600" };
  const normalised = plan.toLowerCase();
  if (normalised.includes("basic"))
    return { label: "Basic",   className: "bg-sky-100 text-sky-700" };
  if (normalised.includes("regular"))
    return { label: "Regular", className: "bg-violet-100 text-violet-700" };
  if (normalised.includes("premium"))
    return { label: "Premium", className: "bg-amber-100 text-amber-700" };
  // Fallback — show whatever the server sends
  return { label: plan, className: "bg-slate-100 text-slate-600" };
}

const AssignedPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Patient | null>(null);

  useEffect(() => {
    getAssignedPatients()
      .then((res) => setPatients(res.patients))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Collect distinct plan names for the filter dropdown
  const distinctPlans = Array.from(new Set(patients.map((p) => p.paymentPlan).filter(Boolean))).sort() as string[];

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.chronicConditions ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.bloodGroup ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesPlan =
      planFilter === "all" || p.paymentPlan === planFilter;

    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-4">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Patients",  value: patients.length,                          color: "bg-slate-50 border-slate-200"    },
          { label: "Active",          value: patients.filter((p) => p.isActive).length, color: "bg-emerald-50 border-emerald-200" },
          { label: "Inactive",        value: patients.filter((p) => !p.isActive).length,color: "bg-amber-50 border-amber-200"    },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Search + plan filter */}
      <div className="flex items-center gap-3">
        <input
          placeholder="Search by name, condition, or blood group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="all">All plans</option>
          {distinctPlans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          ⚠ {error}
        </div>
      )}

      <TableShell
        title="Assigned Patients"
        subtitle={
          loading
            ? "Loading…"
            : `${filtered.length} patient${filtered.length !== 1 ? "s" : ""} found.`
        }
      >
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading patients…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3">Chronic Conditions</th>
                  <th className="px-4 py-3">Care Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const badge = planBadge(p.paymentPlan);
                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{calcAge(p.dateOfBirth)}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{p.gender}</td>
                      <td className="px-4 py-3 text-slate-600">{p.bloodGroup ?? "—"}</td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">
                        {p.chronicConditions ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            p.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "h-1.5 w-1.5 rounded-full",
                              p.isActive ? "bg-emerald-500" : "bg-slate-400",
                            ].join(" ")}
                          />
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelected(p)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:shadow-md"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                      {patients.length === 0
                        ? "No patients with an active care plan yet."
                        : "No patients match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableShell>

      {/* Patient detail modal */}
      {selected && (() => {
        const badge = planBadge(selected.paymentPlan);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selected.fullName}</h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {selected.gender} · Age {calcAge(selected.dateOfBirth)} · {selected.bloodGroup ?? "Blood group unknown"}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label} Plan
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "NIC",                 value: selected.nic },
                  { label: "Date of Birth",        value: selected.dateOfBirth },
                  { label: "Contact",              value: selected.contactNumber ?? "—" },
                  { label: "Emergency Contact",    value: selected.emergencyContact ?? "—" },
                  { label: "Address",              value: selected.address ?? "—" },
                  { label: "Blood Group",          value: selected.bloodGroup ?? "—" },
                  { label: "Allergies",            value: selected.allergies ?? "—" },
                  { label: "Current Medications",  value: selected.currentMedications ?? "—" },
                  { label: "Chronic Conditions",   value: selected.chronicConditions ?? "—" },
                  { label: "Medical History",      value: selected.medicalHistory ?? "—" },
                  { label: "Care Plan",            value: badge.label },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="w-44 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
                    <span className="text-slate-700 leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="mt-6 w-full rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AssignedPatients;