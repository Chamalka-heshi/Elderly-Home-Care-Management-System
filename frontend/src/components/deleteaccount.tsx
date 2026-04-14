import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
// ── UPDATED IMPORT PATH ──
import { deleteAccount } from '../api/auth/auth.api';
import { useNavigate } from 'react-router-dom';

const DeleteAccountButton: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  if (!user) return null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Logic change: We no longer need to pass user.email 
      // because the API uses the token to identify you.
      await deleteAccount(); 
      
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
      {error && <p className="text-red-500 mb-2 font-medium text-sm">✕ {error}</p>}
      {success && <p className="text-green-500 mb-2 font-medium text-sm">✓ {success}</p>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className={`px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 ${
          loading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : 'Delete Account'}
      </button>
    </div>
  );
};

export default DeleteAccountButton;