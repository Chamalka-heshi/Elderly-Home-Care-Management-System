import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { signup } from '../../api/auth.api';
import type { UserRole } from '../../auth/AuthContext';

interface SignupForm {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({
    fullName: '', email: '', contactNumber: '', password: '', confirmPassword: '', role: 'family'
  });
  const [errors, setErrors] = useState<Partial<SignupForm>>({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
    setSuccessMsg('');
  };

  const validate = (): Partial<SignupForm> => {
    const newErrors: Partial<SignupForm> = {};
    if (!form.fullName) newErrors.fullName = 'Full name required';
    if (!form.email) newErrors.email = 'Email required';
    if (!form.contactNumber) newErrors.contactNumber = 'Contact required';
    if (!form.password || form.password.length < 8) newErrors.password = 'Password too short';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    try {
      await signup({
        full_name: form.fullName,
        email: form.email,
        contact_number: form.contactNumber,
        password: form.password,
        role: form.role
      });
      setSuccessMsg('Signup successful! Redirecting...');
      setTimeout(() => navigate('/signin'), 1500);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <AuthLayout title="Create Account" footerText="Already have an account?" footerLink="/signin" footerLinkText="Sign in">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="+11234567890" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
          {errors.contactNumber && <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all">
            <option value="doctor">Doctor</option>
            <option value="caregiver">Caregiver</option>
            <option value="family">Family</option>
          </select>
        </div>
        {serverError && <p className="text-red-500 text-sm mt-1">{serverError}</p>}
        {successMsg && <p className="text-green-500 text-sm mt-1">{successMsg}</p>}
        <button type="submit" className="w-full bg-[#512D55] text-white py-3 rounded-xl font-semibold hover:bg-[#3d2241] transition-colors">Sign Up</button>
      </form>
    </AuthLayout>
  );
};

export default Signup;
