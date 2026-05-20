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
  const [isSignUpMode, setIsSignUpMode] = useState(false); // Toggle between Login and Sign Up mode

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMessage('');
    setLoading(true);

    // Check if we are using the placeholder URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || supabaseUrl.includes('placeholder') || supabaseUrl.includes('seucodigo')) {
      setAuthError('Erro: O aplicativo não está conectado ao banco de dados. A URL do Supabase configurada é inválida ou é um exemplo. Use a URL real do seu projeto (ex: https://abcdefghijklmno.supabase.co).');
      setLoading(false);
      return;
    }

    try {
      // Add a timeout to prevent infinite loading if the server hangs
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: O servidor demorou muito para responder. Verifique se a URL do Supabase está correta e se o projeto não está pausado.')), 15000)
      );

      let authPromise;
      if (isSignUpMode) {
        authPromise = supabase.auth.signUp({
          email,
          password,
        });
      } else {
        authPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      
      if (isSignUpMode) {
        setSuccessMessage('Conta criada com sucesso! Se o Supabase exigir confirmação, verifique seu email. Caso contrário, você já pode fazer login.');
        setIsSignUpMode(false); // Switch back to login mode
      }
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        setAuthError('Erro de conexão: Não foi possível acessar o banco de dados. Verifique sua internet ou a URL do Supabase no Vercel.');
      } else if (error.message === 'Invalid login credentials') {
        setAuthError('Credenciais inválidas. Verifique se o email e a senha estão corretos. Se você acabou de criar a conta, pode ser necessário confirmar o email (verifique sua caixa de entrada).');
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
            <p className="text-slate-500">
              {isSignUpMode ? 'Crie sua conta para começar' : 'Faça login para gerenciar suas vendas'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
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
                {loading ? 'Aguarde...' : (isSignUpMode ? 'Criar Conta' : 'Entrar')}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setAuthError('');
                  setSuccessMessage('');
                }}
                disabled={loading}
                className="text-sm text-brand-primary hover:underline mt-2 text-center"
              >
                {isSignUpMode 
                  ? 'Já tem uma conta? Faça login' 
                  : 'Não tem uma conta? Crie aqui'}
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
