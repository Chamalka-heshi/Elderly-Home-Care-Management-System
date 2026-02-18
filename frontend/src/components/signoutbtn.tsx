import { useNavigate } from 'react-router-dom';
import { signout } from '../api/auth.api';
import { useAuth } from '../auth/AuthContext';

// LogOut icon as SVG component
const LogOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SignOutButton = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signout(setUser, navigate);
      navigate('/'); 
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <LogOut />
      <span className="text-sm font-medium">Logout</span>
    </button>
  );
};

export default SignOutButton;