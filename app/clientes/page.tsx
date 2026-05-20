"use client";

import React from 'react';
import { Users, Plus } from 'lucide-react';

export default function Clientes() {
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
           <p className="text-slate-500">Gestão da carteira de clientes</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
         <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
           <Users size={28} />
         </div>
         <h2 className="text-lg font-bold text-slate-700 mb-2">Painel de Clientes Restaurado</h2>
         <p className="text-slate-500 max-w-md mx-auto">
           A estrutura foi recriada. Os seus clientes estão mantidos seguros em nuvem através de seu Supabase vinculado.
         </p>
      </div>
    </div>
  );
}
