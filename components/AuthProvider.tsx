'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import BottomNav from '@/components/BottomNav';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent, isSignUpAction: boolean) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setLoading(true);
    setIsSignUp(isSignUpAction);

    // Check if we are using the placeholder URL
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || process.env.NEXT_PUBLIC_SUPABASE_URL === '') {
      setAuthError('Erro: O aplicativo não está conectado ao banco de dados. Configure a variável NEXT_PUBLIC_SUPABASE_URL.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUpAction) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage('Conta criada com sucesso! Verifique seu email para confirmar o cadastro (se necessário) ou tente fazer login.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        setAuthError('Erro de conexão: Não foi possível acessar o banco de dados. Verifique sua internet ou a URL do Supabase no Vercel.');
      } else {
        setAuthError(error.message || 'Erro de autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Andresa Eudora</h1>
            <p className="text-slate-500">Faça login para gerenciar suas vendas</p>
          </div>

          <form onSubmit={(e) => handleAuth(e, false)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                required
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                {authError}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl">
                {successMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
              >
                {loading && !isSignUp ? 'Aguarde...' : 'Entrar'}
              </button>
              
              <button
                type="button"
                onClick={(e) => handleAuth(e, true)}
                disabled={loading}
                className="w-full py-3 bg-white text-brand-primary border border-brand-primary rounded-xl font-medium hover:bg-brand-primary/5 transition-colors disabled:opacity-50"
              >
                {loading && isSignUp ? 'Aguarde...' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
