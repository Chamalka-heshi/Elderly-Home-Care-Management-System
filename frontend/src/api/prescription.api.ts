// src/api/prescription.api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Prescription API — mirrors the NestJS PrescriptionController endpoints.
//
// VITE_API_URL must include the /api prefix that NestJS sets globally.
// Example .env:  VITE_API_URL=http://localhost:3000/api
// ─────────────────────────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MedicineItem {
  medicineName:  string;
  dosage:        string;
  frequency:     string;
  durationDays:  number;
  instructions?: string;
}

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued';

export interface Prescription {
  id:          string;
  /** Optional – doctor can create a prescription before the patient record exists */
  patientId?:  string;
  patientName: string;
  patientAge:  number;
  diagnosis?:  string;
  notes?:      string;
  issuedDate:  string;
  validUntil?: string;
  medicines:   MedicineItem[];
  status:      PrescriptionStatus;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreatePrescriptionPayload {
  /** Optional – link to patient table later when that module is ready */
  patientId?:  string;
  patientName: string;
  patientAge:  number;
  diagnosis?:  string;
  notes?:      string;
  issuedDate:  string;
  validUntil?: string;
  medicines:   MedicineItem[];
}

export type UpdatePrescriptionPayload = Partial<CreatePrescriptionPayload> & {
  status?: PrescriptionStatus;
};

/** Shape returned by GET /api/prescriptions */
export interface PrescriptionListResponse {
  data:  Prescription[];
  total: number;
  page:  number;
  limit: number;
}

export interface GetAllParams {
  patientId?: string;
  status?:    PrescriptionStatus;
  search?:    string;
  page?:      number;
  limit?:     number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  // auth.api.tsx stores the JWT under the key 'token'
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('[prescriptionApi] No auth token found in localStorage. User may not be logged in.');
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const body = await res.json();
      // NestJS can return { message } (string or string[]) or { error }
      const raw = body?.message ?? body?.error ?? message;
      message = Array.isArray(raw) ? raw.join('; ') : String(raw);
    } catch {
      // body wasn't JSON — keep status text
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/** Strips empty strings from optional fields so the backend doesn't receive "" */
function sanitizePayload(payload: CreatePrescriptionPayload): CreatePrescriptionPayload {
  const body: CreatePrescriptionPayload = {
    patientName: payload.patientName.trim(),
    patientAge:  payload.patientAge,
    issuedDate:  payload.issuedDate,
    medicines:   payload.medicines.map((m) => ({
      medicineName:  m.medicineName.trim(),
      dosage:        m.dosage.trim(),
      frequency:     m.frequency,
      durationDays:  Number(m.durationDays),
      ...(m.instructions?.trim() ? { instructions: m.instructions.trim() } : {}),
    })),
  };
  if (payload.patientId?.trim())  body.patientId  = payload.patientId.trim();
  if (payload.diagnosis?.trim())  body.diagnosis  = payload.diagnosis.trim();
  if (payload.notes?.trim())      body.notes      = payload.notes.trim();
  if (payload.validUntil?.trim()) body.validUntil = payload.validUntil.trim();
  return body;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const prescriptionApi = {
  /**
   * GET /api/prescriptions
   * Paginated list, scoped to the logged-in doctor.
   */
  getAll: (params?: GetAllParams): Promise<PrescriptionListResponse> => {
    const qs = new URLSearchParams();
    if (params?.patientId) qs.set('patientId', params.patientId);
    if (params?.status)    qs.set('status',    params.status);
    if (params?.search)    qs.set('search',    params.search);
    if (params?.page  != null) qs.set('page',  String(params.page));
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const qStr = qs.toString();
    return fetch(`${BASE}/prescriptions${qStr ? `?${qStr}` : ''}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<PrescriptionListResponse>(r));
  },

  /** GET /api/prescriptions/:id */
  getOne: (id: string): Promise<Prescription> =>
    fetch(`${BASE}/prescriptions/${id}`, { headers: authHeaders() })
      .then((r) => handleResponse<Prescription>(r)),

  /** POST /api/prescriptions */
  create: (payload: CreatePrescriptionPayload): Promise<Prescription> =>
    fetch(`${BASE}/prescriptions`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(sanitizePayload(payload)),
    }).then((r) => handleResponse<Prescription>(r)),

  /** PATCH /api/prescriptions/:id — partial update of any fields */
  update: (id: string, payload: UpdatePrescriptionPayload): Promise<Prescription> =>
    fetch(`${BASE}/prescriptions/${id}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    }).then((r) => handleResponse<Prescription>(r)),

  /**
   * PATCH /api/prescriptions/:id/discontinue
   * Soft-delete: keeps the row, changes status to 'discontinued'.
   */
  discontinue: (id: string): Promise<Prescription> =>
    fetch(`${BASE}/prescriptions/${id}/discontinue`, {
      method:  'PATCH',
      headers: authHeaders(),
    }).then((r) => handleResponse<Prescription>(r)),

  /**
   * PATCH /api/prescriptions/:id/complete
   * Marks the prescription as 'completed'.
   */
  complete: (id: string): Promise<Prescription> =>
    fetch(`${BASE}/prescriptions/${id}/complete`, {
      method:  'PATCH',
      headers: authHeaders(),
    }).then((r) => handleResponse<Prescription>(r)),

  /** DELETE /api/prescriptions/:id — hard delete, returns 204 */
  remove: (id: string): Promise<void> =>
    fetch(`${BASE}/prescriptions/${id}`, {
      method:  'DELETE',
      headers: authHeaders(),
    }).then((r) => handleResponse<void>(r)),
};
