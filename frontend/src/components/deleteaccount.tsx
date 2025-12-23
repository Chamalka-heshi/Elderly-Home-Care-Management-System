import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { deleteAccount } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';

const DeleteAccountButton: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  if (!user) return null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteAccount(user.email);
      setUser(null);
      setSuccess('Account deleted successfully.');
      setTimeout(() => navigate('/signup'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className={`px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors ${
          loading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Deleting...' : 'Delete Account'}
      </button>
    </div>
  );
};

export default DeleteAccountButton;
