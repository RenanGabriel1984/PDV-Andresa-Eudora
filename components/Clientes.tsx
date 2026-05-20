'use client';
import { useAuth } from '@/hooks/useAuth';

export default function ClientesAction() {
  const { role } = useAuth();
  
  const handleDeleteCliente = async (id: string) => {
    if (role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir registros.');
      return;
    }
    // Lógica para excluir cliente
  };

  return (
    <div>
      {/* Outras informações do cliente */}
      {role === 'admin' && (
        <button onClick={() => handleDeleteCliente('1')} className="bg-red-500 text-white">
          Excluir Cliente
        </button>
      )}
    </div>
  );
}
