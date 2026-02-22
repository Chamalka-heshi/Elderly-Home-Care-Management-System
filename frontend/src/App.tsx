import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

// Public Pages
import Home from './features/home/Home';
import About from './features/about/AboutUsPage';
import Services from './features/services/servicesPage';
import Payments from './features/payments/PaymentsPage';
import Contact from './features/contact/contactPage';

// Auth Pages
import LoginCard from './features/auth/Login/LoginCard';
import SignupCard from './features/auth/Signin/Signupcard';

// Dashboards
import AdminDashboard from './features/dashboards/adminDashboard';
import DoctorDashboard from './features/dashboards/doctorDashboard';
import CaregiverDashboard from './features/dashboards/caregiverDashboard';
import FamilyDashboard from './features/dashboards/FamilyDashboard';

// Profile Page
import Profile from './components/UserProfile';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginCard
        onSuccessClose={() => navigate('/')}
        onGoSignup={() => navigate('/signup')}
      />
    </div>
  );
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignupCard
        onSuccessClose={() => navigate('/')}
        onGoLogin={() => navigate('/login')}
      />
    </div>
  );
};

/* -------------------- App -------------------- */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Dashboards */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver/*"
            element={
              <ProtectedRoute role="caregiver">
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family/*"
            element={
              <ProtectedRoute role="family">
                <FamilyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Profile Pages per Role */}
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute role="admin">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute role="doctor">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver/profile"
            element={
              <ProtectedRoute role="caregiver">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family/profile"
            element={
              <ProtectedRoute role="family">
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;