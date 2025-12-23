import React, { FC } from 'react'
import Sigout from '../../components/signoutbtn'
import UserProfile from '../../components/UserProfile';
import DeleteAccountButton from '../../components/deleteaccount';
import { useAuth } from '../../auth/AuthContext';

const DoctorDashboard = () => {
  const { user,setUser } = useAuth();
  return (
    <div>
      <h1 className="p-6 text-xl">Doctor Dashboard</h1>
      <UserProfile/>
      <Sigout/>
      <DeleteAccountButton userEmail={user.email} setUser={setUser} />
      nttiugbrtgnvjkfl
    </div>
  )
}

export default DoctorDashboard
