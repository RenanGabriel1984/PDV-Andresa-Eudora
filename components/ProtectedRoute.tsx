'use client';

import { useAuth, UserRole } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles = ['admin'] }: ProtectedRouteProps) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!role || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
        router.replace('/'); // Redirect to home or show error
      }
    }
  }, [role, loading, router, allowedRoles]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Verificando permissões...</div>;
  }

  if (!role || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p>Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}
