// src/api/patient.api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Patient API — mirrors the NestJS PatientsController endpoints.
//
// Endpoints used by family member dashboard:
//   POST   /api/patients             — create (family only)
//   GET    /api/patients/my-patients — list own patients (family only)
//   GET    /api/patients/:id         — single patient
//   PATCH  /api/patients/:id         — update own patient
//   DELETE /api/patients/:id         — delete own patient
//
// VITE_API_URL must include the /api prefix.
// Example .env:  VITE_API_URL=http://localhost:3000/api
// ─────────────────────────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  id:                  string;
  fullName:            string;
  nic:                 string;
  dateOfBirth:         string;         // ISO date string YYYY-MM-DD
  gender:              Gender;
  bloodGroup?:         string;
  address?:            string;
  contactNumber?:      string;
  emergencyContact?:   string;
  medicalHistory?:     string;
  allergies?:          string;
  currentMedications?: string;
  chronicConditions?:  string;
  familyMemberId:      string;
  isActive:            boolean;
  createdAt:           string;
  updatedAt:           string;
}

export interface CreatePatientPayload {
  fullName:            string;
  // NIC: 9 digits + V/X  OR  12 digits  (Sri Lankan format — validated by backend)
  nic:                 string;
  dateOfBirth:         string;         // YYYY-MM-DD
  gender:              Gender;
  bloodGroup?:         string;
  address?:            string;
  // contactNumber & emergencyContact must be exactly 10 digits if provided
  contactNumber?:      string;
  emergencyContact?:   string;
  medicalHistory?:     string;
  allergies?:          string;
  currentMedications?: string;
  chronicConditions?:  string;
  // familyMemberId is injected server-side from the JWT — NOT sent by the client
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

/**
 * Shape returned by GET /api/patients/my-patients
 * Backend returns { patients, total } — NOT { data, total }
 */
export interface PatientListResponse {
  patients: Patient[];
  total:    number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('[patientApi] No auth token found in localStorage.');
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
      const raw  = body?.message ?? body?.error ?? message;
      message    = Array.isArray(raw) ? raw.join('; ') : String(raw);
    } catch {
      // body wasn't JSON — keep status text
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/**
 * Strips empty optional fields before sending.
 * contactNumber & emergencyContact have @Matches(/^[0-9]{10}$/) on the backend —
 * sending an empty string would cause a 400, so we only include them when filled.
 */
function sanitizePayload(payload: CreatePatientPayload): CreatePatientPayload {
  const body: CreatePatientPayload = {
    fullName:    payload.fullName.trim(),
    nic:         payload.nic.trim(),
    dateOfBirth: payload.dateOfBirth,
    gender:      payload.gender,
  };
  if (payload.bloodGroup?.trim())         body.bloodGroup         = payload.bloodGroup.trim();
  if (payload.address?.trim())            body.address            = payload.address.trim();
  if (payload.contactNumber?.trim())      body.contactNumber      = payload.contactNumber.trim();
  if (payload.emergencyContact?.trim())   body.emergencyContact   = payload.emergencyContact.trim();
  if (payload.medicalHistory?.trim())     body.medicalHistory     = payload.medicalHistory.trim();
  if (payload.allergies?.trim())          body.allergies          = payload.allergies.trim();
  if (payload.currentMedications?.trim()) body.currentMedications = payload.currentMedications.trim();
  if (payload.chronicConditions?.trim())  body.chronicConditions  = payload.chronicConditions.trim();
  return body;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const patientApi = {
  /**
   * GET /api/patients/my-patients
   * Returns only the patients belonging to the logged-in family member.
   * Restricted to role: family
   */
  getAll: (): Promise<PatientListResponse> =>
    fetch(`${BASE}/patients/my-patients`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<PatientListResponse>(r)),

  /**
   * GET /api/patients/:id
   * Accessible by family, doctor, caregiver, admin.
   */
  getOne: (id: string): Promise<Patient> =>
    fetch(`${BASE}/patients/${id}`, { headers: authHeaders() })
      .then((r) => handleResponse<Patient>(r)),

  /**
   * POST /api/patients
   * familyMemberId is resolved server-side from the JWT.
   * Restricted to role: family
   */
  create: (payload: CreatePatientPayload): Promise<{ message: string; patient: Patient }> =>
    fetch(`${BASE}/patients`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(sanitizePayload(payload)),
    }).then((r) => handleResponse<{ message: string; patient: Patient }>(r)),

  /**
   * PATCH /api/patients/:id
   * Only the owning family member can update.
   */
  update: (id: string, payload: UpdatePatientPayload): Promise<{ message: string; patient: Patient }> =>
    fetch(`${BASE}/patients/${id}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    }).then((r) => handleResponse<{ message: string; patient: Patient }>(r)),

  /**
   * DELETE /api/patients/:id — returns 204 No Content
   * Only the owning family member can delete.
   */
  remove: (id: string): Promise<void> =>
    fetch(`${BASE}/patients/${id}`, {
      method:  'DELETE',
      headers: authHeaders(),
    }).then((r) => handleResponse<void>(r)),
};