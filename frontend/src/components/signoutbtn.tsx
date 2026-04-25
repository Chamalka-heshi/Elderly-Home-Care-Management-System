import { useNavigate } from 'react-router-dom';
import { signout } from "../api/auth/auth.api";
import { useAuth } from '../auth/AuthContext';
import { IconLogout } from '../features/dashboards/common/icons'; 

const SignOutButton = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signout(setUser, navigate);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <IconLogout />
      <span className="text-sm font-medium">Logout</span>
    </button>
  );
};

export default SignOutButton;