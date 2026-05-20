"use client";

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { TrendingUp, Package, Users, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, role } = useAuth();
  const userName = user?.email ? user.email.split('@')[0] : 'Consultora';
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-800 to-fuchsia-700 text-white p-6 rounded-3xl shadow-xl border border-purple-500 relative overflow-hidden">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-20"></div>
         <h1 className="text-2xl font-bold relative z-10 leading-tight">
           Olá, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
         </h1>
         <p className="text-purple-100 mt-2 relative z-10 font-medium opacity-90">Visão Geral do seu Painel</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <Link href="/vendas" className="bg-white p-5 rounded-3xl shadow-sm border border-purple-50 flex flex-col items-center text-center active:scale-95 transition-transform">
            <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center text-purple-700 mb-3">
               <ShoppingCart size={28} />
            </div>
            <p className="font-bold text-slate-800 text-sm">Nova Venda</p>
         </Link>
         
         <Link href="/estoque" className="bg-white p-5 rounded-3xl shadow-sm border border-purple-50 flex flex-col items-center text-center active:scale-95 transition-transform">
            <div className="bg-fuchsia-100 w-14 h-14 rounded-full flex items-center justify-center text-fuchsia-600 mb-3">
               <Package size={28} />
            </div>
            <p className="font-bold text-slate-800 text-sm">Estoque</p>
         </Link>

         <Link href="/clientes" className="bg-white p-5 rounded-3xl shadow-sm border border-purple-50 flex flex-col items-center text-center active:scale-95 transition-transform">
            <div className="bg-violet-100 w-14 h-14 rounded-full flex items-center justify-center text-violet-700 mb-3">
               <Users size={28} />
            </div>
            <p className="font-bold text-slate-800 text-sm">Clientes</p>
         </Link>
         
         <div className="bg-emerald-500 p-5 rounded-3xl shadow-sm flex flex-col items-center text-center text-white active:scale-95 transition-transform">
            <div className="bg-emerald-400 w-14 h-14 rounded-full flex items-center justify-center text-white mb-3 shadow-inner">
               <TrendingUp size={28} />
            </div>
            <p className="font-bold text-sm">Relatórios</p>
         </div>
      </div>
    </div>
  );
}
