import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { AuthUser, LoginCredentials, SignupCredentials } from './auth.types';

export const FIREBASE_NOT_CONFIGURED_ERROR =
  'Firebase Authentication is not configured. Please define VITE_FIREBASE_* environment variables to authenticate.';

export function mapFirebaseError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please verify your connection to Firebase.';
    case 'auth/expired-action-code':
      return 'The password reset link or code has expired.';
    case 'auth/invalid-action-code':
      return 'The password reset link or code is invalid.';
    default:
      return error.message || 'Authentication request failed.';
  }
}

function mapUser(fbUser: FirebaseUser): AuthUser {
  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    photoURL: fbUser.photoURL,
  };
}

export const authService = {
  isConfigured(): boolean {
    return isFirebaseConfigured && auth !== null;
  },

  async login({ email, password }: LoginCredentials): Promise<AuthUser> {
    if (!this.isConfigured() || !auth) {
      throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      return mapUser(cred.user);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async signup({ email, password, displayName }: SignupCredentials): Promise<AuthUser> {
    if (!this.isConfigured() || !auth) {
      throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (trimmedName) {
        await updateFirebaseProfile(cred.user, { displayName: trimmedName });
      }
      return mapUser(cred.user);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async logout(): Promise<void> {
    if (!this.isConfigured() || !auth) {
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async forgotPassword(email: string): Promise<void> {
    if (!this.isConfigured() || !auth) {
      throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required');

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async resetPassword(password: string, code?: string): Promise<void> {
    if (!this.isConfigured() || !auth) {
      throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }

    if (!code) {
      throw new Error('A valid reset action code is required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      await confirmPasswordReset(auth, code, password);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async updateProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
    if (!this.isConfigured() || !auth || !auth.currentUser) {
      throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    }

    try {
      await updateFirebaseProfile(auth.currentUser, profile);
    } catch (err: any) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async getToken(): Promise<string | null> {
    if (!this.isConfigured() || !auth || !auth.currentUser) {
      return null;
    }
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  },

  getCurrentUser(): AuthUser | null {
    if (!this.isConfigured() || !auth || !auth.currentUser) {
      return null;
    }
    return mapUser(auth.currentUser);
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!this.isConfigured() || !auth) {
      callback(null);
      return () => {};
    }

    const unsubscribe = onFirebaseAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        callback(mapUser(fbUser));
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  },
};
