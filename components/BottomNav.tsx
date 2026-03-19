'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShoppingCart, Package } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/estoque', icon: Package, label: 'Estoque' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-light border-t border-primary/10 px-6 py-3 z-50">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-primary/70'
              } transition-colors`}
            >
              <Icon size={24} className={isActive ? 'fill-primary/20' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
