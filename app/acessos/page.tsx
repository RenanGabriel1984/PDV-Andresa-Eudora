"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ShieldUser, ShieldAlert, Key, Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { api, Profile } from "@/lib/api";

export default function AcessosPage() {
  const { profile, loadingProfile, profileError } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (profile?.role === "admin") {
        try {
          const fetchedProfiles = await api.getProfiles();
          setProfiles(fetchedProfiles);
        } catch (error) {
          console.error("Error loading profiles:", error);
        } finally {
          setLoading(false);
        }
      } else if (!loadingProfile) {
        setLoading(false);
      }
    }
    loadData();
  }, [profile, loadingProfile]);

  const toggleRole = async (targetId: string, currentRole: string) => {
    if (targetId === profile?.id) {
       alert("Você não pode alterar seu próprio nível de acesso aqui.");
       return;
    }
    
    setSavingId(targetId);
    const newRole = currentRole === "admin" ? "vendedor" : "admin";
    
    try {
      await api.updateProfileRole(targetId, newRole);
      setProfiles(p => p.map(u => u.id === targetId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o nível de acesso.");
    } finally {
      setSavingId(null);
    }
  };

  if (loadingProfile || loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <Header
        showBack
        title="Controle de Acessos"
        bgColor="bg-red-600"
        textColor="text-white"
      />

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {profile?.role !== "admin" ? (
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
            <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-red-700 mb-2">Acesso Negado</h2>
            <p className="text-red-600/80">Você não tem permissão para visualizar esta página.</p>
          </div>
        ) : profileError === 'TABLE_MISSING' || profiles.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
               <Key size={32} />
            </div>
            <h2 className="text-xl font-bold text-center text-slate-800">Painel de Acesso Seguro</h2>
            <p className="text-slate-600 text-center text-sm">
              Para gerenciar os perfis de vendedores, o banco de dados Supabase precisa ter a nova tabela de Perfis criada.
            </p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
{`-- Execute este código SQL no seu Supabase (SQL Editor):
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (opcional mas recomendado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow admin to update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow upsert for new users" ON profiles FOR INSERT WITH CHECK (true);
`}
              </pre>
            </div>
            <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold mt-4">
              Após criar a tabela, os novos cadastros aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-primary/10 bg-slate-50">
               <h3 className="font-bold text-slate-800">Usuários Cadastrados</h3>
               <p className="text-xs text-slate-500">Apenas administradores podem gerenciar cadastros e acesso configurações globais.</p>
             </div>
             <div className="divide-y divide-primary/5">
                {profiles.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                         <ShieldUser size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-800">{user.email}</p>
                         <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                       </div>
                     </div>
                     
                     <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={savingId === user.id || user.id === profile.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          user.id === profile.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                          user.role === 'admin' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                     >
                       {savingId === user.id ? 'Salvando...' : (
                         <>
                           {user.id === profile.id ? 'Você' : (user.role === 'admin' ? 'Tirar Admin' : 'Dar Admin')}
                         </>
                       )}
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
