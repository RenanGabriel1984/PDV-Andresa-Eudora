import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutWrapper } from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Sistema de Vendas',
  description: 'Dashboard de vendas e acessos com múltiplos usuários',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
