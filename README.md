# 🏥 ECMS — Elderly Care Management System

A full-stack web application for managing elderly care homes. It connects **admins**, **doctors**, **caregivers**, and **family members** under one secure platform to coordinate patient care, appointments, prescriptions, payments, and more.

---

## 📁 Project Structure

```
ecms/
├── backend/      # NestJS REST API
└── frontend/     # React + Vite SPA
```

---

## ✨ Features

### 👤 Role-Based Access
| Role | Access |
|------|--------|
| `super_admin` | Full system control including admin management |
| `admin` | Manage all users, patients, care plans, slots, payments, settings |
| `doctor` | Appointments, channeling slots, prescriptions, patient history |
| `caregiver` | Assigned patients, care notes, medication logs, vital records, schedules |
| `family` | View elderly profile, care plans, appointments, prescriptions, payments |

### 🔐 Security
- HttpOnly JWT cookie-based authentication
- CSRF token protection on all state-mutating requests
- Role-based route guards on every protected endpoint
- Rate limiting (throttling) on login and signup endpoints
- Google Firebase OAuth login support
- Password hashing with bcrypt
- Helmet HTTP security headers

### 📋 Modules
- **Patient Management** — register and manage elderly residents
- **Appointments** — request, approve, and track doctor appointments
- **Care Plans** — create and update personalised care plans per patient
- **Channeling Slots** — doctors publish availability; family/admin book slots
- **Prescriptions** — doctors issue prescriptions; family and caregivers can view
- **Care Notes** — caregivers log daily care observations per patient
- **Medication Logs** — track medication administration by caregivers
- **Vital Records** — record patient vitals (blood pressure, temperature, etc.)
- **Payments** — family submits payments; admin approves and tracks history
- **Bookings** — manage caregiver bookings and scheduling
- **Contact** — public contact form; admin manages contact info and messages
- **Mail** — automated email notifications via SMTP (nodemailer)
- **Profile Management** — all roles can update their profile and avatar

---

## 🛠 Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| [NestJS](https://nestjs.com/) | Node.js framework (TypeScript) |
| [TypeORM](https://typeorm.io/) | ORM for PostgreSQL |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [JWT + cookie-parser](https://github.com/auth0/node-jsonwebtoken) | Session management via HttpOnly cookies |
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | Google OAuth token verification |
| [Nodemailer](https://nodemailer.com/) | Email delivery (SMTP) |
| [Helmet](https://helmetjs.github.io/) | HTTP security headers |
| [NestJS Throttler](https://docs.nestjs.com/security/rate-limiting) | Rate limiting |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [Multer](https://github.com/expressjs/multer) | File uploads (avatar images) |
| [class-validator](https://github.com/typestack/class-validator) | DTO validation |

### Frontend
| Tech | Purpose |
|------|---------|
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [TailwindCSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Firebase SDK](https://firebase.google.com/docs/web/setup) | Google OAuth on client |
| [Axios](https://axios-http.com/) | HTTP client |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running locally
- A Firebase project (for Google OAuth)
- A Gmail SMTP app password (for email)

---

### 1. Clone the repository

```bash
git clone https://github.com/Chamalka-heshi/Elderly-Home-Care-Management-System.git
cd Elderly-Home-Care-Management-System
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_NAME=ecms

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# App
PORT=3000
NODE_ENV=development
SYSTEM_NAME=Care Home Management System

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run start:dev
```

Backend runs at: `http://localhost:3000/api`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 📂 Backend Module Overview

```
backend/src/
├── common/
│   ├── constants/          # Security constants (CSRF, cookie config)
│   ├── decorators/         # @GetUser, @Public
│   ├── enums/              # UserRole enum
│   ├── filters/            # Global HTTP exception filter
│   ├── guards/             # JwtAuthGuard, RolesGuard, CsrfGuard, ThrottlerGuard
│   └── modules/            # JwtConfigModule
├── config/                 # App configuration (DB, JWT, CORS, SMTP)
└── modules/
    ├── auth/               # Login, signup, profile, password management, Firebase OAuth
    ├── users/              # Core user entity and service
    ├── admin/              # Admin profile and management
    ├── doctors/            # Doctor profile and management
    ├── caregivers/         # Caregiver profile, care notes, medication logs, vital records
    ├── family/             # Family member profile and management
    ├── patients/           # Patient registration and management
    ├── appointments/       # Appointment requests and approvals
    ├── care-plan/          # Patient care plan creation and updates
    ├── channeling-slot/    # Doctor availability slots and bookings
    ├── bookings/           # Caregiver booking management
    ├── prescription/       # Doctor prescriptions per patient
    ├── payments/           # Payment submission and approval
    ├── contact/            # Contact form and contact info management
    └── mail/               # Email notification service
```

---

## 📂 Frontend Module Overview

```
frontend/src/
├── api/                    # All API call functions grouped by feature
├── auth/                   # AuthContext, AuthProvider, ProtectedRoute
├── config/                 # Firebase client config
├── features/
│   ├── home/               # Public landing page
│   ├── about/              # About page
│   ├── services/           # Services page
│   ├── payments/           # Public payments info page
│   ├── contact/            # Public contact form
│   ├── auth/               # Login, Signup, ForgotPassword, ForceChangePassword
│   └── dashboards/
│       ├── admin/          # Admin dashboard and all admin pages
│       ├── doctor/         # Doctor dashboard and pages
│       ├── caregiver/      # Caregiver dashboard and pages
│       ├── familymember/   # Family member dashboard and pages
│       └── common/         # Shared UI components (Sidebar, Avatar, Icons, etc.)
```

---

## 🔑 Authentication Flow

1. User logs in via email/password or Google OAuth.
2. Backend validates credentials, issues a **signed JWT stored in an HttpOnly cookie**.
3. A **CSRF token** is returned in the response body and stored in `sessionStorage`.
4. All subsequent requests include the cookie (automatic) and the CSRF token header (`X-CSRF-Token`).
5. On page load, the frontend calls `GET /api/auth/profile` to restore session silently.
6. A `401` on the profile bootstrap means no active session — the user is sent to `/login`.
7. A `401` on any other request mid-session means the cookie expired — the user is sent to `/login?reason=expired` with a banner.

---

## 🧪 Running Tests

```bash
# Backend unit tests
cd backend
npm run test

# Backend test coverage
npm run test:cov

# Frontend tests
cd frontend
npm run test
```

---

## 📜 Available Scripts

### Backend
| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:prod` | Start compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run test` | Run unit tests |
| `npm run lint` | Lint and auto-fix source files |

### Frontend
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |

---

## 🌿 Branch Strategy

| Branch | Purpose | Contributor |
|--------|---------|-------------|
| `main` | Stable production-ready code | Team |
| `Admin-Poorna.Danushka` | Admin module, auth & security features, backup & recovery, contact, doctor scheduling, profile management | [@Poorna-danushka](https://github.com/Poorna-danushka) |
| `feature/*` | Individual feature branches | Team |

---

## 👨‍💻 Individual Contribution — Poorna Danushka

- **Branch:** `Admin-Poorna.Danushka`
- **GitHub:** [@Poorna-danushka](https://github.com/Poorna-danushka)

### 📌 Overview
I contributed to the ECMS project through the development and design of the system's authentication and security layer, admin module, account and staff onboarding, contact management, doctor scheduling, profile management, and backup and recovery features. The project was a large full-stack healthcare management platform, and my work was concentrated on the parts of the system that made it secure, operationally usable, well-structured, and ready for real elderly-care workflows.

---

### 🔐 1. Authentication & Security Foundation
- **JWT & Secure Cookie Sessions:** Implemented the login and signup flow using JWT-based authentication, managing sessions through secure `HttpOnly` cookies rather than exposing tokens to client-side JavaScript.
- **Credential Hashing & Recovery:** Hashed all credentials with `bcrypt`, built forgot-password and reset-password flows so users could recover accounts safely, and enforced a mandatory password change on first login for newly created accounts.
- **Security Hardening & Rate Limiting:** Added rate limiting on authentication endpoints to resist brute-force attempts, tracked failed login attempts with temporary account lockout, and implemented CSRF protection on all state-changing requests.
- **Guards & Protected Routes:** Paired frontend protected routes (redirecting unauthorized or session-expired users away from restricted pages) with backend JWT and role-based guards so every controller endpoint is strictly accessible only by authenticated and authorized users.

---

### 👥 2. Role-Based Access Control (RBAC) & Staff Onboarding
- **5-Role Access Architecture:** Implemented role-based access control across five roles — `super_admin`, `admin`, `doctor`, `caregiver`, and `family` — ensuring each role can only access the pages and API endpoints relevant to their responsibilities.
- **Controlled Staff Provisioning:** Built a structured onboarding flow where super admins can create new admin accounts, and admins can create doctor and caregiver accounts.
- **One-Time Temporary Passwords:** Each newly created staff account receives a one-time temporary password via email and is mandated to change the password during the first login, providing a secure and professional onboarding mechanism without manual credential sharing.

---

### ⚙️ 3. Admin Module Architecture, UI/UX Design & UML Modeling
- **Figma UI/UX Design:** Designed the Admin Dashboard UI in Figma, including dashboard statistics, management tables for doctors, caregivers, and families, and modular form components for adding, updating, and deactivating user accounts to ensure clean and efficient administrative workflows.
- **Relational Database Planning:** Planned the PostgreSQL database schema for administrator and user management, structuring relationships and constraints between `Admins`, `Users`, and `Roles` entities to ensure data consistency and seamless RBAC integration.
- **UML Diagrams & Process Visualization:** Created the **Admin Use Case Diagram** (representing user and role lifecycle activities) and **Sequence Diagram** (visualizing workflows for adding, updating, and deactivating accounts across the UI, backend services, and database).

---

### 📬 4. End-to-End Contact Management Module
- **Public Inquiry Flow:** Implemented the public-facing contact form and database storage for incoming inquiries.
- **Admin Management & Inquiries Dashboard:** Built an admin dashboard where messages can be viewed, filtered by status, and inspected in detail.
- **Two-Way Communication:** Implemented the reply workflow enabling admins to reply to inquiries directly from the dashboard, which marks messages as replied and automatically triggers an email back to the original sender via SMTP.

---

### 🩺 5. Doctor Scheduling & Channeling Slot Management
- **Channeling Slot Lifecycle:** Built the workflow where admins create channeling slots, doctors view assigned slots to accept or reject them based on availability, and doctors update their consultation fees for individual slots.
- **Care Coordination Link:** Connected doctor availability with appointment booking and payment workflows across the platform.

---

### 🖼️ 6. Profile Management & Cloud Storage Integration
- **Role Profile Management:** Implemented full profile management allowing users of all roles to update their personal information.
- **Cloudinary Avatar Uploads:** Built profile picture upload with type and size validation, automated upload to Cloudinary for hosted storage, secure URL storage against user records in PostgreSQL, and support for photo removal.

---

### 💾 7. Database Backup, Disaster Recovery & Integrity Verification
- **Automated & Manual Snapshots:** Implemented backup creation, restore, retention management, and integrity verification, writing compressed snapshot files to persistent storage with metadata (file size, checksum, database version).
- **Cloud-Ready Architecture:** Designed the backup storage layer with extensibility to cloud object storage (e.g., AWS S3) for offsite retention.
- **Operational Awareness:** Connected the module to the email service so administrators receive instant email alerts whenever a backup succeeds or fails.

---

### ☁️ 8. Infrastructure, Deployment & Quality Assurance
- **Cloud Database (AWS RDS):** Configured the backend to connect to a PostgreSQL database hosted on AWS RDS.
- **Environment Configuration:** Centralized database, JWT, SMTP, and Cloudinary configurations into environment variables for multi-environment support.
- **Frontend Dashboard Components:** Built reusable components, layouts, and consistent navigation across admin, doctor, caregiver, and family dashboards.
- **Testing & Documentation:** Improved system maintainability with backend unit tests, robust error handling, and detailed documentation of the architecture, setup process, and authentication flows.

---

### 💡 Challenges & Solutions
- **Complex Multi-Role UI & State Management:** Addressed the challenge of managing multiple user types and actions cleanly by designing modular, reusable Figma components and structuring consistent role-based dashboard layouts.
- **RBAC & Schema Consistency:** Structured relational constraints and entity relationships carefully before backend integration, leveraging UML diagrams to clarify responsibilities between UI, backend controllers, and database entities.

---

> *Note: This summary reflects the individual work authored by Poorna Danushka on the `Admin-Poorna.Danushka` branch as part of the collaborative ECMS project.*


