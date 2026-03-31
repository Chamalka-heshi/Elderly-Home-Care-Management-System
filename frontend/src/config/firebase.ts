import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';

// ── Firebase config ───────────────────────────────────────────────────────────
// All values come from your .env file.
// Get these from Firebase Console → Project Settings → Your Apps → Web.

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Prevent duplicate app initialisation during hot-reload in dev.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// ── Google Provider ───────────────────────────────────────────────────────────

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Google sign-in helper ─────────────────────────────────────────────────────
// Returns the Firebase UserCredential. We then extract the ID token
// and send it to our NestJS backend for verification.

export const signInWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, googleProvider);

// Sign out from Firebase (call this alongside clearing localStorage).
export const signOutFirebase = (): Promise<void> => firebaseSignOut(auth);