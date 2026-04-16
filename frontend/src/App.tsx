import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import AuthProvider    from "./auth/AuthProvider";
import ProtectedRoute  from "./auth/ProtectedRoute";

import Home     from "./features/home/Home";
import About    from "./features/about/AboutUsPage";
import Services from "./features/services/servicesPage";
import Payments from "./features/payments/PaymentsPage";
import Contact  from "./features/contact/contactPage";

import LoginCard           from "./features/auth/Login/LoginCard";
import SignupCard          from "./features/auth/Signin/Signupcard";
import ForgotPasswordCard  from "./features/auth/ForgotPassword/ForgotPassword";
import ForceChangePassword from "./features/auth/ForceChangePassword/ForceChangePassword";

import AdminDashboard     from "./features/dashboards/admin/AdminDashboard";
import DoctorDashboard    from "./features/dashboards/doctor/DoctorDashboard";
import CaregiverDashboard from "./features/dashboards/caregiver/CaregiverDashboard";
import FamilyDashboard    from "./features/dashboards/familymember/FamilyMemberDashboard";

import AdminProfile        from "./features/dashboards/admin/pages/AdminProfile";
import DoctorProfile       from "./features/dashboards/doctor/pages/DoctorProfile";
import FamilyMemberProfile from "./features/dashboards/familymember/pages/FamilyMemberProfile";
import CaregiverProfile    from "./features/dashboards/caregiver/pages/CaregiverProfile";

// ── Shared card shell ─────────────────────────────────────────────────────────
// Wraps standalone auth pages so they look identical to the AuthModal card.
const AuthPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 p-4">
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
      {children}
    </div>
  </div>
);

// ── Standalone auth pages ─────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const sessionExpired = new URLSearchParams(window.location.search).get('reason') === 'expired';
  return (
    <AuthPageShell>
      {sessionExpired && (
        <div className="flex items-center gap-2 rounded-b-none rounded-t-3xl border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
          <span>⏱️</span>
          <span>Your session expired. Please sign in again to continue.</span>
        </div>
      )}
      <LoginCard
        onSuccessClose={() => navigate("/")}
        onGoSignup={() => navigate("/signup")}
        onForgotPassword={() => navigate("/forgot-password")}
      />
    </AuthPageShell>
  );
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPageShell>
      <SignupCard
        onSuccessClose={() => navigate("/")}
        onGoLogin={() => navigate("/login")}
      />
    </AuthPageShell>
  );
};

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPageShell>
      <ForgotPasswordCard onGoLogin={() => navigate("/login")} />
    </AuthPageShell>
  );
};

const AdminProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return <AdminProfile onBack={() => navigate("/admin")} />;
};

const DoctorProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return <DoctorProfile onBack={() => navigate("/doctor")} />;
};

const FamilyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return <FamilyMemberProfile onBack={() => navigate("/family")} />;
};

const CaregiverProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return <CaregiverProfile onBack={() => navigate("/caregiver")} />;
};

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/"               element={<Home />} />
        <Route path="/about"          element={<About />} />
        <Route path="/services"       element={<Services />} />
        <Route path="/payments"       element={<Payments />} />
        <Route path="/contact"        element={<Contact />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/signup"         element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ForceChangePassword />} />

        {/* ── Protected dashboard shells ── */}
        <Route path="/admin/*"     element={<ProtectedRoute role="admin">    <AdminDashboard />    </ProtectedRoute>} />
        <Route path="/doctor/*"    element={<ProtectedRoute role="doctor">   <DoctorDashboard />   </ProtectedRoute>} />
        <Route path="/caregiver/*" element={<ProtectedRoute role="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/family/*"    element={<ProtectedRoute role="family">   <FamilyDashboard />   </ProtectedRoute>} />

        {/* ── Profile pages ── */}
        <Route path="/admin/profile"    element={<ProtectedRoute role="admin">    <AdminProfilePage />    </ProtectedRoute>} />
        <Route path="/doctor/profile"   element={<ProtectedRoute role="doctor">   <DoctorProfilePage />   </ProtectedRoute>} />
        <Route path="/caregiver/profile" element={<ProtectedRoute role="caregiver"><CaregiverProfilePage /></ProtectedRoute>} />
        <Route path="/family/profile"   element={<ProtectedRoute role="family">   <FamilyProfilePage />   </ProtectedRoute>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;