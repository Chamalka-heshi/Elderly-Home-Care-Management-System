import React from 'react';
import { useAuth } from '../auth/AuthContext';

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <p className="text-gray-500">No user logged in</p>;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 max-w-sm">
      <h2 className="text-xl font-bold mb-2">Current User</h2>
      <p><strong>Name:</strong> {user.full_name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
    </div>
  );
};

export default UserProfile;
