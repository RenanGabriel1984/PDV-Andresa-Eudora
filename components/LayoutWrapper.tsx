"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  ShieldCheck, 
  Menu, 
  X, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
    { name: 'Estoque', href: '/estoque', icon: Package },
    { name: 'Clientes', href: '/clientes', icon: Users },
  ];

  // Admin only items
  if (role === 'admin') {
    navItems.push({ name: 'Acessos', href: '/acessos', icon: ShieldCheck });
    navItems.push({ name: 'Configurações', href: '/configuracoes', icon: Settings });
  }

  // To simulate Auth in preview without actual DB connectivity stalling the UI
  // we can show children immediately, but real app handles redirect.

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile sidebar placeholder/overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-lg font-bold text-white tracking-tight">SistemaVendas</span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 mt-2 px-2">Menu Principal</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
           <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl">
              <div className="flex flex-col truncate pr-2">
                <span className="text-xs font-medium text-slate-400 truncate">{user?.email || 'Modo Preview'}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mt-0.5">{role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-10">
           <div className="flex items-center gap-4">
              <button 
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {navItems.find(n => n.href === pathname)?.name || 'Opções'}
              </h1>
           </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
