import Image from 'next/image';
import { ArrowLeft, Bell, Search, Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  bgColor?: string;
  textColor?: string;
}

export default function Header({
  title,
  showBack = false,
  showMenu = false,
  showSearch = false,
  showNotifications = false,
  showProfile = false,
  bgColor = 'bg-background-light/80',
  textColor = 'text-slate-900',
}: HeaderProps) {
  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className={`sticky top-0 z-40 ${bgColor} backdrop-blur-md border-b border-primary/10`}>
      <div className="flex items-center p-4 justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3 w-1/3">
          {showBack && (
            <Link href="/" className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 cursor-pointer ${textColor}`}>
              <ArrowLeft size={20} className={textColor === 'text-slate-900' ? 'text-gold' : 'text-white'} />
            </Link>
          )}
          {showMenu && (
            <div className={`flex size-10 items-center justify-center rounded-lg bg-white/10 cursor-pointer ${textColor}`}>
              <Menu size={24} />
            </div>
          )}
          {title && (
            <h1 className={`text-lg font-bold leading-tight tracking-tight hidden sm:block ${textColor}`}>
              {title}
            </h1>
          )}
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm border border-gold/30">
              E
            </div>
            <span className="text-gold font-serif text-sm font-semibold mt-1 tracking-wide">
              Andresa Eudora
            </span>
          </div>
        </div>

        <div className="flex gap-2 w-1/3 justify-end items-center">
          {showSearch && (
            <button className={`flex size-10 items-center justify-center rounded-full bg-white/10 ${textColor}`}>
              <Search size={20} />
            </button>
          )}
          {showNotifications && (
            <button className={`flex size-10 items-center justify-center rounded-full bg-white/10 ${textColor}`}>
              <Bell size={20} />
            </button>
          )}
          {showProfile && (
            <button onClick={handleLogout} className={`flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-red-50 hover:text-red-500 transition-colors ${textColor}`} title="Sair">
              <LogOut size={20} />
            </button>
          )}
          {!showSearch && !showNotifications && !showProfile && <div className="size-10"></div>}
        </div>
      </div>
    </header>
  );
}
