import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';

// Infrastructure Configuration

// Connects the application to Firebase services using environment variables to maintain security and portability across environments.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Application Initialization

// Singleton pattern ensures that the Firebase app is only initialized once, preventing errors during development hot-reloads.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Identity Provider Configuration

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// External Authentication Handlers

// Facilitates social authentication via Google, returning credentials that are subsequently validated by the backend trust layer.
export const signInWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, googleProvider);

// Terminating the Firebase session to ensure local security context is synchronized with the remote authentication state.
export const signOutFirebase = (): Promise<void> => firebaseSignOut(auth);