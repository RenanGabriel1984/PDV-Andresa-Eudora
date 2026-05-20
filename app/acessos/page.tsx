"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ShieldAlert, ShieldCheck, UserCog, DatabaseZap } from 'lucide-react';
import { api, Profile } from '@/lib/api';

export default function Acessos() {
  const { user, role, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (role === 'admin') {
      api.getProfiles().then(({data, error}) => {
        if (data) setProfiles(data);
        setLoadingProfiles(false);
      });
    } else {
      setLoadingProfiles(false);
    }
  }, [role]);

  const toggleRole = async (targetId: string, currentRole: string) => {
    if (targetId === user?.id) {
       alert("Você não pode alterar seu próprio nível de acesso.");
       return;
    }
    const newRole = currentRole === "admin" ? "vendedor" : "admin";
    try {
      await api.updateProfileRole(targetId, newRole);
      setProfiles(p => p.map(u => u.id === targetId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o acesso. Certifique-se que o usuário já fez o primeiro login.");
    }
  };

  if (loading || loadingProfiles) {
    return (
      <div className="flex items-center justify-center p-10 h-full">
         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-sm">Você precisa ser administrador para gerenciar o acesso de painel e os vendedores do sistema.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
           <UserCog size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Controle de Acesso</h1>
          <p className="text-slate-500 mt-1">Gerencie os vendedores e administradores da sua loja.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" />
            Usuários Cadastrados
          </h2>
        </div>
        
        {profiles.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/30">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <DatabaseZap size={24} />
            </div>
            <h3 className="font-bold text-slate-700 mb-1">Nenhum perfil encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Para listar os usuários aqui, certifique-se de que a tabela <code>profiles</code> existe no seu banco de dados Supabase e que os usuários efetuaram o primeiro login.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {profiles.map(p => (
              <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    p.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{p.email}</p>
                    <p className="text-sm text-slate-500 capitalize font-medium flex items-center gap-1.5 mt-0.5">
                      {p.role === 'admin' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      )}
                      {p.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {p.id === user?.id ? (
                    <span className="bg-emerald-50 text-emerald-600 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border border-emerald-100">
                      Você
                    </span>
                  ) : (
                    <button 
                      onClick={() => toggleRole(p.id, p.role)}
                      className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm border ${
                        p.role === 'admin' 
                          ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                          : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {p.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
