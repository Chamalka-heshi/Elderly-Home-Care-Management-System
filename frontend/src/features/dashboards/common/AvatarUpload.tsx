import React, { useRef, useState } from "react";
import { uploadAvatar, removeAvatar } from "../../../api/auth/auth.api";
import { useAuth } from "../../../auth/AuthContext";

interface Props {
  initials: string;
  accent?: string;
  size?: "lg" | "sm";
  onSuccess?: (avatarUrl: string) => void;
  onError?: (message: string) => void;
  onRemoved?: () => void;
  interactive?: boolean;
}

// Icons
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Reusable avatar component with built-in upload/removal logic to standardize profile management
const AvatarUpload: React.FC<Props> = ({
  initials,
  accent = "emerald",
  size = "lg",
  onSuccess,
  onError,
  onRemoved,
  interactive = true,
}) => {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = user?.avatarUrl ?? null;

  const dim = size === "lg"
    ? "h-16 w-16 text-xl rounded-2xl"
    : "h-11 w-11 text-sm rounded-2xl";

  const dotSize = size === "lg"
    ? "h-4 w-4 -bottom-1 -right-1 border-2"
    : "h-3 w-3 -bottom-0.5 -right-0.5 border-2";

  // Handle image file selection and perform async upload to persist the new profile picture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const { avatarUrl: newUrl } = await uploadAvatar(file);

      if (user) {
        const updated = { ...user, avatarUrl: newUrl };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }

      onSuccess?.(newUrl);
    } catch (err: any) {
      onError?.(err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Remove the custom avatar to revert to initials fallback and sync state with the backend
  const handleRemove = async () => {
    try {
      setUploading(true);
      await removeAvatar();

      if (user) {
        const updated = { ...user, avatarUrl: null };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }

      onRemoved?.();
    } catch (err: any) {
      onError?.(err.message || "Failed to remove avatar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={[
            "grid place-items-center overflow-hidden font-bold text-white shadow-lg",
            dim,
            avatarUrl
              ? "bg-slate-200"
              : `bg-${accent}-600 shadow-${accent}-600/25`,
          ].join(" ")}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            initials
          )}
        </div>

        <span
          className={[
            "absolute rounded-full border-white bg-emerald-500",
            dotSize,
          ].join(" ")}
        />

        {interactive && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Change profile photo"
            className={[
              "absolute inset-0 flex items-center justify-center rounded-2xl",
              "bg-black/40 opacity-0 transition-opacity hover:opacity-100",
              uploading ? "cursor-wait" : "cursor-pointer",
            ].join(" ")}
          >
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CameraIcon className="h-6 w-6 text-white drop-shadow" />
            )}
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {interactive && avatarUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <TrashIcon className="h-3 w-3" />
          Remove photo
        </button>
      )}

      {interactive && !avatarUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <CameraIcon className="h-3 w-3" />
          Upload photo
        </button>
      )}
    </div>
  );
};

export default AvatarUpload;
