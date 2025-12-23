import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { signout } from '../api/auth.api';

const SignOutButton: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signout(setUser, navigate);
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
