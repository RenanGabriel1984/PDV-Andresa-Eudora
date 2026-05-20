'use client';
import { useAuth } from '@/hooks/useAuth';

export default function ProdutosAction() {
  const { role } = useAuth();
  
  const handleDeleteProduto = async (id: string) => {
    if (role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir registros.');
      return;
    }
    // Lógica para excluir produto
  };

  return (
    <div>
      {/* Outras informações do produto */}
      {role === 'admin' && (
        <button onClick={() => handleDeleteProduto('1')} className="bg-red-500 text-white">
          Excluir Produto
        </button>
      )}
    </div>
  );
}
