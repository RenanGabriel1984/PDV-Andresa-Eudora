'use client';

import { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'seller';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
