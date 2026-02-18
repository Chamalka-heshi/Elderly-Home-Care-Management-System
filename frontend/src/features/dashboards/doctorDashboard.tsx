import React from 'react';
import SignOutButton from '../../components/signoutbtn';
import UserProfile from '../../components/UserProfile';
import { useAuth } from '../../auth/AuthContext';

const DoctorDashboard: React.FC = () => {
  const { user, setUser } = useAuth();

  if (!user || !setUser) {
    return <p className="p-6 text-red-500">Loading user data...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Doctor Dashboard</h1>
      <UserProfile />
      <div className="my-4">
      </div>
      <SignOutButton />
    </div>
  );
};

export default DoctorDashboard;
