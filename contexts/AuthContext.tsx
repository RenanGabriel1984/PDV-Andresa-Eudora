"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// We map user roles from DB or use email check for admin.
// According to request, 'renan.gabriel_@outlook.com' is the main administrator.
export const SUPER_ADMIN_EMAIL = 'renan.gabriel_@outlook.com';

interface AuthContextProps {
  user: User | null;
  role: 'admin' | 'vendedor';
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  role: 'vendedor',
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'vendedor'>('vendedor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For standard supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser?.email === SUPER_ADMIN_EMAIL) {
        setRole('admin');
      } else {
        // Here you would normally fetch from a 'profiles' table.
        // For safe fallback to protect data, we default to vendedor.
        setRole('vendedor');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email === SUPER_ADMIN_EMAIL) {
        setRole('admin');
      } else {
        setRole('vendedor');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
