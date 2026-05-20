"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email === SUPER_ADMIN_EMAIL) {
        setRole('admin');
      } else {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
    setLoading(false);
  };

  if (loading && !user) {
    return <div className="min-h-screen bg-purple-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-700"></div>
    </div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-purple-800 p-8 text-center text-white">
             <h1 className="text-3xl font-bold">PDV Andresa</h1>
             <p className="text-purple-200 mt-2">Acesso ao Sistema</p>
          </div>
          <div className="p-8">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
                {authError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors" 
                  placeholder="Seu email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Senha</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors" 
                  placeholder="Sua senha"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-xl transition-colors mt-4 text-lg"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
