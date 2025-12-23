import React, { FC } from 'react'
import Sigout from '../../components/signoutbtn'
import UserProfile from '../../components/UserProfile';
import DeleteAccountButton from '../../components/deleteaccount';
import { useAuth } from '../../auth/AuthContext';

const FamilyDashboard = () => {
  const { user,setUser } = useAuth();
  return (
    <div>
      <h1 className="p-6 text-xl">Patient Dashboard</h1>;
      <UserProfile/>
     <DeleteAccountButton userEmail={user.email} setUser={setUser} />
      <Sigout/>
    </div>
  )
}

export default FamilyDashboard
