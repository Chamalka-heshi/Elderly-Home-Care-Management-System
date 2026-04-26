import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { deleteAccount } from "../api/auth/auth.api";
import { useNavigate } from "react-router-dom";

// Component to handle secure account deletion with confirmation
const DeleteAccountButton: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  if (!user) return null;

  // Execute deletion after user confirmation and clean up local session
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      // The API identifies the user via their authentication token
      await deleteAccount(); 
      
      setUser(null);
      setSuccess("Account deleted successfully.");

      setTimeout(() => navigate("/"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      {/* Feedback Messages */}
      {error && <p className="text-red-500 mb-2 font-medium text-sm">✕ {error}</p>}
      {success && <p className="text-green-500 mb-2 font-medium text-sm">✓ {success}</p>}

      {/* Delete Trigger */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className={`px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Delete Account"}
      </button>
    </div>
  );
};

export default DeleteAccountButton;