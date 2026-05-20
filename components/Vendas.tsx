'use client';
import { useAuth } from '@/hooks/useAuth';

export default function VendasAction() {
  const { role } = useAuth();
  
  const handleDeleteVenda = async (id: string) => {
    if (role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir registros.');
      return;
    }
    // Lógica para excluir venda
  };

  return (
    <div>
      {/* Outras informações da venda */}
      {role === 'admin' && (
        <button onClick={() => handleDeleteVenda('1')} className="bg-red-500 text-white">
          Excluir Venda
        </button>
      )}
    </div>
  );
}
