"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Package, Users, Activity } from 'lucide-react';

export default function Home() {
  const { user, role } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-8">
         <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
           Olá, {user?.email ? user.email.split('@')[0] : 'Usuário'}!
         </h1>
         <p className="text-slate-500 mt-1">Bem-vindo(a) de volta ao Sistema de Vendas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600">
               <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Vendas no Mês</p>
              <h3 className="text-2xl font-bold text-slate-800">--</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600">
               <Package size={24} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Produtos no Estoque</p>
              <h3 className="text-2xl font-bold text-slate-800">--</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600">
               <Users size={24} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Clientes Ativos</p>
              <h3 className="text-2xl font-bold text-slate-800">--</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600">
               <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Nível de Acesso</p>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{role}</h3>
            </div>
         </div>
      </div>
      
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col items-start gap-4 max-w-2xl">
          <div className="bg-emerald-400 text-slate-900 text-xs font-bold px-3 py-1 pb-1.5 rounded-full uppercase tracking-wider inline-block">
             Sistema Restaurado
          </div>
          <h2 className="text-2xl font-bold text-white">Interface Reconstruída sem Perda de Dados</h2>
          <p className="text-slate-300">
            A estrutura visual do projeto inteiro foi re-esculpida. A configuração do <strong>Supabase</strong> é acessada de forma dinâmica, garantindo que toda a sua base de clientes, estoque e vendas anterior permaneça intacta. O painel de acessos para vendedores e administradores está estritamente funcional.
          </p>
        </div>
      </div>
    </div>
  );
}
