import React from "react";
import { IconX } from "../../common/icons";

export interface FieldConfig {
  name:        string;
  label:       string;
  type?:       string;
  placeholder?: string;
  required?:   boolean;
  textarea?:   boolean;                            
  options?:    { value: string; label: string }[]; 
  hint?:       string;                             
}

interface Props {
  title:    string;
  open:     boolean;
  loading?: boolean;
  onClose:  () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  fields:   FieldConfig[];
}

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 " +
  "outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10";

// Reusable modal component for rendering dynamic forms based on a declarative field configuration
const FormModal: React.FC<Props> = ({ title, open, loading, onClose, onSubmit, fields }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dim the background to focus user attention on the active modal form */}
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          {fields.map((f) => (
            <label key={f.name} className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                {f.label}
                {f.required && <span className="ml-0.5 text-red-500">*</span>}
              </span>

              {/* Dynamically render the appropriate input type based on the field configuration */}
              {f.options ? (
                <select
                  name={f.name}
                  required={f.required}
                  defaultValue={f.options[0]?.value}
                  className={inputBase}
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : f.textarea ? (
                <textarea
                  name={f.name}
                  placeholder={f.placeholder}
                  required={f.required}
                  rows={4}
                  className={inputBase + " resize-y"}
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  name={f.name}
                  placeholder={f.placeholder}
                  required={f.required}
                  min={f.type === "number" ? "0" : undefined}
                  className={inputBase}
                />
              )}

              {f.hint && (
                <p className="text-[11px] font-medium text-slate-400">{f.hint}</p>
              )}
            </label>
          ))}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
