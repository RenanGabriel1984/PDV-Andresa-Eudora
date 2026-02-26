import type {Metadata} from 'next';
import { Manrope } from 'next/font/google';
import './globals.css'; // Global styles
import BottomNav from '@/components/BottomNav';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Andresa Eudora - Gestão',
  description: 'Aplicativo de gestão para revendedoras',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable}`}>
      <body suppressHydrationWarning className="bg-background-light font-display text-slate-900 min-h-screen pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
