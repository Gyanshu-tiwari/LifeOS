import { createContext } from 'react';
import { AuthContextValue } from './auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);
