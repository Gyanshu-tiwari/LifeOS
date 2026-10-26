export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string, code?: string) => Promise<void>;
  updateProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  getToken: () => Promise<string | null>;
}
