"use client";

import React, { useEffect, useState } from 'react';
import { Users, Plus, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  useEffect(() => {
    api.getClientes().then(({data, error}) => {
      if (error) setErrorObj(error);
      setClientes(data);
      setLoading(false);
    });
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">Clientes</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-2 md:px-4 md:py-2 md:rounded-xl rounded-full font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
          <Plus size={20} /> <span className="hidden md:inline">Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-100">
        {loading ? (
           <div className="flex justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
           </div>
        ) : errorObj ? (
           <div className="p-6 text-center text-red-500">
             <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
             <p className="font-bold">Erro ao buscar clientes</p>
             <p className="text-sm mt-1">{errorObj}</p>
           </div>
        ) : clientes.length > 0 ? (
          <ul className="divide-y divide-purple-50">
            {clientes.map((cliente: any, i) => (
              <li key={i} className="p-4 flex items-center gap-4 hover:bg-purple-50/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                  {(cliente.nome || cliente.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{cliente.nome || cliente.name || 'Cliente'}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{cliente.telefone || cliente.email || 'Sem contato salvo'}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-slate-500">
             <Users size={48} className="mx-auto mb-4 text-purple-200" />
             <p className="font-semibold text-slate-700">Nenhum cliente cadastrado</p>
             <p className="text-sm mt-1">O seu guia de clientes ficará organizado aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
