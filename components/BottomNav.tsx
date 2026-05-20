"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, Users } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  
  const items = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Vendas', href: '/vendas', icon: ShoppingCart },
    { name: 'Estoque', href: '/estoque', icon: Package },
    { name: 'Clientes', href: '/clientes', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href} 
            className={`flex flex-col items-center justify-center w-full py-3 ${isActive ? 'text-purple-700' : 'text-slate-400 hover:text-purple-400'}`}
          >
            <Icon size={24} className={isActive ? "fill-purple-100" : ""} />
            <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
