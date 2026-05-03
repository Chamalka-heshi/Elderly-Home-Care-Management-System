import React, { useRef, useState } from "react";
import { IconX, IconAlertCircle } from "../../common/icons";

export interface FieldConfig {
  name:            string;
  label:           string;
  type?:           string;
  placeholder?:    string;
  required?:       boolean;
  textarea?:       boolean;
  options?:        { value: string; label: string }[];
  hint?:           string;
  /** Regex pattern string (without delimiters) for custom format validation */
  pattern?:        string;
  /** Error message shown when pattern does not match */
  patternMessage?: string;
  /** Minimum string length */
  minLength?:      number;
  /** Maximum string length */
  maxLength?:      number;
  /** Minimum numeric value (for type="number") */
  min?:            number;
  /** Maximum numeric value (for type="number") */
  max?:            number;
}

interface Props {
  title:          string;
  open:           boolean;
  loading?:       boolean;
  /** Server-side error message to display inside the modal */
  error?:         string | null;
  onClose:        () => void;
  onSubmit:       (e: React.FormEvent<HTMLFormElement>) => void;
  /** Called whenever the user edits a field — use to clear the server error */
  onErrorClear?:  () => void;
  fields:         FieldConfig[];
}

const inputBase =
  "w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-800 " +
  "outline-none transition focus:ring-4";

const inputNormal = `${inputBase} border-slate-200 bg-white focus:border-emerald-300 focus:ring-emerald-500/10`;
const inputErr    = `${inputBase} border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-500/10`;

/** Run all configured validations for a single field. Returns an error string or "". */
function validateField(f: FieldConfig, raw: string): string {
  const value = raw.trim();

  if (f.required && !value) return `${f.label} is required.`;
  if (!value) return "";

  if (f.minLength && value.length < f.minLength)
    return `${f.label} must be at least ${f.minLength} characters.`;
  if (f.maxLength && value.length > f.maxLength)
    return `${f.label} cannot exceed ${f.maxLength} characters.`;
  if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Enter a valid email address.";
  if (f.pattern && !new RegExp(f.pattern).test(value))
    return f.patternMessage ?? `${f.label} format is invalid.`;
  if (f.type === "number") {
    const n = Number(value);
    if (isNaN(n)) return `${f.label} must be a valid number.`;
    if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}.`;
    if (f.max !== undefined && n > f.max) return `${f.label} cannot exceed ${f.max}.`;
  }

  return "";
}

// Reusable modal component for dynamic forms with inline field validation and an API-error banner.
// All validation failures are shown inline — not just as fleeting toast notifications.
const FormModal: React.FC<Props> = ({
  title, open, loading, error, onClose, onSubmit, onErrorClear, fields,
}) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) return null;

  const setOne = (name: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [name]: msg }));

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    f: FieldConfig,
  ) => setOne(f.name, validateField(f, e.target.value));

  const handleChange = (name: string) => {
    setOne(name, "");
    onErrorClear?.();
  };

  const handleClose = () => {
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Validate every field up-front so all broken fields are highlighted at once
    const errors: Record<string, string> = {};
    for (const f of fields) {
      const msg = validateField(f, (fd.get(f.name) as string) ?? "");
      if (msg) errors[f.name] = msg;
    }

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors).find((k) => errors[k]);
      if (firstKey)
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${firstKey}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={handleClose} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Server-side / API error banner — rendered inside the modal so it is never missed */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Could not save</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-4">
          {fields.map((f) => {
            const hasErr = !!fieldErrors[f.name];
            const sharedProps = {
              name: f.name,
              "aria-invalid": hasErr,
              "aria-describedby": hasErr ? `fm-err-${f.name}` : undefined,
              onBlur: (e: React.FocusEvent<any>) => handleBlur(e, f),
              onChange: () => handleChange(f.name),
              className: hasErr ? inputErr : inputNormal,
            };

            return (
              <div key={f.name} className="grid gap-1.5">
                <label htmlFor={`fm-${f.name}`} className="text-xs font-semibold text-slate-600">
                  {f.label}
                  {f.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                {f.options ? (
                  <select id={`fm-${f.name}`} required={f.required} defaultValue={f.options[0]?.value} {...sharedProps}>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : f.textarea ? (
                  <textarea id={`fm-${f.name}`} placeholder={f.placeholder} required={f.required} rows={4} {...sharedProps} className={(hasErr ? inputErr : inputNormal) + " resize-y"} />
                ) : (
                  <input
                    id={`fm-${f.name}`}
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    required={f.required}
                    min={f.min !== undefined ? f.min : f.type === "number" ? "0" : undefined}
                    max={f.max !== undefined ? f.max : undefined}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    {...sharedProps}
                  />
                )}

                {/* Per-field validation error takes priority over the hint text */}
                {hasErr ? (
                  <p id={`fm-err-${f.name}`} role="alert" className="flex items-center gap-1.5 text-[11px] font-medium text-red-500">
                    <IconAlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors[f.name]}
                  </p>
                ) : f.hint ? (
                  <p className="text-[11px] font-medium text-slate-400">{f.hint}</p>
                ) : null}
              </div>
            );
          })}

          <div className="mt-2 flex gap-3">
            <button type="button" onClick={handleClose} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;