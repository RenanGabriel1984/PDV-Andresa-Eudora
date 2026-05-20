"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, AlertCircle, Receipt } from 'lucide-react';
import { api } from '@/lib/api';

export default function Vendas() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  useEffect(() => {
    api.getVendas().then(({data, error}) => {
      if (error) setErrorObj(error);
      setVendas(data);
      setLoading(false);
    });
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">Vendas</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-2 md:px-4 md:py-2 md:rounded-xl rounded-full font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
          <Plus size={20} /> <span className="hidden md:inline">Nova Venda</span>
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
             <p className="font-bold">Erro ao buscar vendas</p>
             <p className="text-sm mt-1">{errorObj}</p>
           </div>
        ) : vendas.length > 0 ? (
          <ul className="divide-y divide-purple-50">
            {vendas.map((venda: any, i) => (
              <li key={i} className="p-4 flex flex-col hover:bg-purple-50/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                   <p className="font-bold text-slate-800">
                     Pedido #{venda.id?.toString().slice(0,6) || i}
                   </p>
                   <p className="font-bold text-emerald-600">
                     R$ {venda.valor_total || venda.total || "0.00"}
                   </p>
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-slate-500 text-sm">
                     {venda.cliente_nome || 'Cliente não informado'}
                   </p>
                   <p className="text-xs text-slate-400">
                     {venda.created_at ? new Date(venda.created_at).toLocaleDateString() : 'Hoje'}
                   </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-slate-500">
             <Receipt size={48} className="mx-auto mb-4 text-purple-200" />
             <p className="font-semibold text-slate-700">Nenhuma venda registrada</p>
             <p className="text-sm mt-1">As suas vendas aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
