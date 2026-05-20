"use client";

import React, { useEffect, useState } from 'react';
import { Package, Plus, AlertCircle, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';

export default function Estoque() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  useEffect(() => {
    api.getProdutos().then(({data, error}) => {
      if (error) setErrorObj(error);
      setProdutos(data);
      setLoading(false);
    });
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">Estoque</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-2 md:px-4 md:py-2 md:rounded-xl rounded-full font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
          <Plus size={20} /> <span className="hidden md:inline">Novo Produto</span>
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
             <p className="font-bold">Erro ao buscar produtos</p>
             <p className="text-sm mt-1">{errorObj}</p>
           </div>
        ) : produtos.length > 0 ? (
          <ul className="divide-y divide-purple-50">
            {produtos.map((produto: any, i) => (
              <li key={i} className="p-4 flex justify-between items-center hover:bg-purple-50/50 transition-colors">
                <div>
                  <p className="font-bold text-slate-800 text-lg leading-tight">{produto.nome || produto.name || 'Produto sem nome'}</p>
                  <p className="text-slate-500 text-sm mt-1">{produto.marca || produto.descricao || 'Sem descrição'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-purple-700">{produto.quantidade ?? produto.estoque ?? 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">UN</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-slate-500">
             <ShoppingBag size={48} className="mx-auto mb-4 text-purple-200" />
             <p className="font-semibold text-slate-700">Seu estoque está vazio</p>
             <p className="text-sm mt-1">Nenhum produto encontrado. Adicione novos itens para visualizá-los aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
