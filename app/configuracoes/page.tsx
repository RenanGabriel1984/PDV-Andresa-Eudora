"use client";

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Settings, ShieldAlert } from 'lucide-react';

export default function Configuracoes() {
  const { role } = useAuth();
  
  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-sm">Você precisa ser administrador para modificar as configurações globais.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
           <p className="text-slate-500">Ajustes gerais do sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
         <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
           <Settings size={28} />
         </div>
         <h2 className="text-lg font-bold text-slate-700 mb-2">Configurações do Sistema</h2>
         <p className="text-slate-500 max-w-md mx-auto">
           Este painel está visível porque você é o Administrador ({role}). Você pode alterar logotipo ou chave PIX aqui assim que a API for mapeada novamente para as rotas originais.
         </p>
      </div>
    </div>
  );
}
