import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'PDV Andresa',
  description: 'Sistema de Ponto de Venda e Gestão',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 min-h-screen pb-20 md:pb-0 font-sans text-slate-800 selection:bg-purple-200">
        <AuthProvider>
          <div className="flex flex-col min-h-screen max-w-3xl mx-auto bg-slate-50 shadow-2xl relative">
            <Header />
            <main className="flex-1 w-full p-4 md:p-6 overflow-x-hidden">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
