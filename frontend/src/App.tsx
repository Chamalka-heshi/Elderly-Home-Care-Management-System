import React from 'react';
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';

import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

import Home from './features/home/Home';
import About from './features/about/AboutUsPage';
import Services from './features/services/servicesPage';
import Payments from './features/payments/PaymentsPage';
import Contact from './features/contact/contactPage';

import AdminDashboard from './features/dashboards/adminDashboard';
import DoctorDashboard from './features/dashboards/doctorDashboard';
import CaregiverDashboard from './features/dashboards/caregiverDashboard';



const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/contact" element={<Contact />} />
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


          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
