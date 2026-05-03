import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCarePlan,
  deactivateCarePlan,
  getAllCarePlans,
  updateCarePlan,
} from "../../../../api/care-plans/admin-care-plan.api";
import type {
  CarePlan,
  CarePlanDurationUnit,
} from "../../../../api/care-plans/care-plan.types";
import { useAuth } from "../../../../auth/AuthContext";
import Badge from "../../common/widgets/Badge";
import TableShell from "../../common/widgets/TableShell";
import { IconEdit, IconHeart, IconTrash } from "../../common/icons";

interface Props {
  addToast: (kind: "success" | "error", message: string) => void;
}

type FormMode = "create" | "edit";

interface CarePlanFormState {
  name: string;
  description: string;
  price: string;
  duration: string;
  durationUnit: CarePlanDurationUnit;
}

const emptyForm: CarePlanFormState = {
  name: "",
  description: "",
  price: "",
  duration: "",
  durationUnit: "days",
};

// CarePlanManagement
// Page for admins to create and manage the subscription care plans
const CarePlanManagement: React.FC<Props> = ({ addToast }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingPlan, setEditingPlan] = useState<CarePlan | null>(null);
  const [form, setForm] = useState<CarePlanFormState>(emptyForm);

  const canManage = user?.role === "admin" || user?.role === "super_admin";

  // Loads the list of care plans from the server
  const loadPlans = useCallback(async () => {
    if (!canManage) return;

    try {
      setLoading(true);
      const data = await getAllCarePlans();
      setPlans(data);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load care plans");
    } finally {
      setLoading(false);
    }
  }, [addToast, canManage]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [plans],
  );

  const openCreateModal = () => {
    setFormMode("create");
    setEditingPlan(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (plan: CarePlan) => {
    setFormMode("edit");
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      duration: String(plan.duration),
      durationUnit: plan.durationUnit,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleFormChange = (
    key: keyof CarePlanFormState,
    value: string | CarePlanDurationUnit,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Saves the plan after checking the inputs
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      durationUnit: form.durationUnit,
    };

    if (!payload.name || !payload.description) {
      addToast("error", "Name and description are required");
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      addToast("error", "Price must be greater than 0");
      return;
    }
    if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
      addToast("error", "Duration must be greater than 0");
      return;
    }

    try {
      setSaving(true);

      if (formMode === "create") {
        await createCarePlan(payload);
        addToast("success", "Care plan created successfully");
      } else if (editingPlan) {
        await updateCarePlan(editingPlan.id, payload);
        addToast("success", "Care plan updated successfully");
      }

      setModalOpen(false);
      await loadPlans();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to save care plan");
    } finally {
      setSaving(false);
    }
  };

  // Deactivates a plan so families can't subscribe to it anymore
  const handleDeactivate = async (plan: CarePlan) => {
    if (!plan.isActive) return;

    if (!window.confirm(`Deactivate "${plan.name}"?`)) return;

    try {
      setDeactivatingId(plan.id);
      const res = await deactivateCarePlan(plan.id);
      addToast("success", res.message || "Care plan deactivated successfully");
      await loadPlans();
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to deactivate care plan",
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  if (!canManage) {
    return (
      <TableShell
        title="Care Plan Management"
        subtitle="Create and manage subscription packages for families."
      >
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-red-700">Access Denied</p>
          <p className="mt-1 text-xs text-red-600">
            Only Admin or Super Admin users can access this page.
          </p>
        </div>
      </TableShell>
    );
  }

  return (
    <>
      <TableShell
        title="Care Plan Management"
        subtitle="Create, update, and deactivate subscription plans."
        right={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <IconHeart className="h-4 w-4" /> + Add Care Plan
          </button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Duration Unit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPlans.map((plan) => (
                  <tr key={plan.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{plan.name}</td>
                    <td className="max-w-[260px] px-4 py-3 text-slate-600">
                      <p className="truncate" title={plan.description}>
                        {plan.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      Rs {Number(plan.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{plan.duration}</td>
                    <td className="px-4 py-3 text-slate-600">{plan.durationUnit}</td>
                    <td className="px-4 py-3">
                      <Badge tone={plan.isActive ? "emerald" : "slate"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <IconEdit className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(plan)}
                          disabled={!plan.isActive || deactivatingId === plan.id}
                          className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                          {deactivatingId === plan.id ? "Deactivating..." : "Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedPlans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                      No care plans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableShell>

      {/* Popup form for creating or editing a plan */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {formMode === "create" ? "Add Care Plan" : "Edit Care Plan"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Name</span>
                <input
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  required
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Price</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Duration</span>
                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(e) => handleFormChange("duration", e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Duration Unit</span>
                <select
                  value={form.durationUnit}
                  onChange={(e) =>
                    handleFormChange("durationUnit", e.target.value as CarePlanDurationUnit)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="days">days</option>
                  <option value="months">months</option>
                </select>
              </label>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : formMode === "create" ? "Create Plan" : "Update Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CarePlanManagement;
