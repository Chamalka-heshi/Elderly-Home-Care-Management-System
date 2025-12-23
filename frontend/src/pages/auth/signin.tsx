import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type User } from '../../auth/AuthContext';
import { signin } from '../../api/auth.api';
import AuthLayout from '../../components/auth/AuthLayout';

interface SignInForm {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignInForm>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData: User = await signin(form);
      setUser(userData);

      switch (userData.role) {
        case 'admin': navigate('/admin'); break;
        case 'doctor': navigate('/doctor'); break;
        case 'caregiver': navigate('/caregiver'); break;
        case 'family': navigate('/family'); break;
        default: setError('Invalid role'); 
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Sign In" footerText="Don't have an account?" footerLink="/signup" footerLinkText="Sign up">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@email.com"
            required className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password"
            required className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button type="submit" disabled={loading} className={`w-full bg-[#512D55] text-white py-3 rounded-xl font-semibold transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#3d2241]'}`}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
