"use client";

import React from 'react';
import { useAuth } from './AuthProvider';
import { Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { role } = useAuth();
  
  return (
    <header className="bg-purple-800 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
      <div className="flex flex-col">
        <h1 className="font-bold text-lg leading-tight">PDV Andresa</h1>
        <span className="text-xs text-purple-200 uppercase tracking-widest">Eudora & O Boticário</span>
      </div>
      <div className="flex items-center gap-2">
        {role === 'admin' && (
          <Link href="/configuracoes" className="p-2 hover:bg-purple-700 rounded-full transition">
             <Settings size={22} />
          </Link>
        )}
        <button 
          onClick={() => supabase.auth.signOut()}
          className="p-2 hover:bg-purple-700 rounded-full transition"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
}
