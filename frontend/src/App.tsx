import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
//import ProtectedRoute from './auth/ProtectedRoute';

import Home from './pages/homePage';
import About from './pages/aboutUsPage';
import Services from './pages/servicesPage';
import Payments from './pages/paymentsPage';
import Contact from './pages/contactPage';
import SignIn from './pages/auth/signin';
import Signup from './pages/auth/signup';
import AdminDashboard from './pages/dashboards/adminDashboard';
import DoctorDashboard from './pages/dashboards/doctorDashboard';
import CaregiverDashboard from './pages/dashboards/caregiverDashboard';
import FamilyDashboard from './pages/dashboards/familyDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<Contact />} />

          <Route
            path="/admin"
            element={
              <AdminDashboard />
              // <ProtectedRoute role="admin">
              //   
              // </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <DoctorDashboard />
              // <ProtectedRoute role="doctor">
              //   
              // </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver"
            element={
              <CaregiverDashboard />
              // <ProtectedRoute role="caregiver">
              //   
              // </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <FamilyDashboard />
              // <ProtectedRoute role="family">
              //   
              // </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
