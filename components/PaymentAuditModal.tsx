'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  PaymentAuditLog,
  getPaymentAuditLogs,
  exportAuditLogsCSV,
  clearLocalAuditLogs,
  formatCurrencyBR,
} from '@/lib/auditLog';
import { api, Sale } from '@/lib/api';

interface PaymentAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterClientId?: string;
  filterClientName?: string;
  onPaymentRestored?: () => void;
}

export default function PaymentAuditModal({
  isOpen,
  onClose,
  filterClientId,
  filterClientName,
  onPaymentRestored,
}: PaymentAuditModalProps) {
  const [logs, setLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'EDIT' | 'DELETE' | 'CREATE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getPaymentAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Client filter if passed from parent
      if (filterClientId && log.clientId && log.clientId !== filterClientId) {
        return false;
      }
      if (filterClientName && log.clientName && !log.clientName.toLowerCase().includes(filterClientName.toLowerCase())) {
        return false;
      }

      // Action filter
      if (actionFilter !== 'ALL' && log.action !== actionFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchClient = log.clientName?.toLowerCase().includes(term);
        const matchSale = log.saleId?.toLowerCase().includes(term);
        const matchUser = log.user?.toLowerCase().includes(term);
        const matchNotes = log.notes?.toLowerCase().includes(term);
        const matchDesc = log.description?.toLowerCase().includes(term);
        const matchDate = log.date?.includes(term);
        return matchClient || matchSale || matchUser || matchNotes || matchDesc || matchDate;
      }

      return true;
    });
  }, [logs, filterClientId, filterClientName, actionFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = logs.length;
    const edits = logs.filter((l) => l.action === 'EDIT').length;
    const deletes = logs.filter((l) => l.action === 'DELETE').length;
    const creates = logs.filter((l) => l.action === 'CREATE').length;
    return { total, edits, deletes, creates };
  }, [logs]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = () => {
    const confirmClear = window.confirm(
      'Atenção: Deseja realmente limpar o histórico local de auditoria?\n\nEsta ação apagará os registros gravados no seu navegador.'
    );
    if (!confirmClear) return;

    clearLocalAuditLogs();
    setLogs([]);
  };

  const handleRestorePayment = async (log: PaymentAuditLog) => {
    if (!log.oldAmount || log.oldAmount <= 0) {
      alert('Não há valor anterior registrado para restaurar.');
      return;
    }

    const confirmRestore = window.confirm(
      `Deseja restaurar o pagamento excluído de ${formatCurrencyBR(log.oldAmount)} para a venda #${log.saleId.slice(0, 8)} de ${log.clientName || 'Cliente'}?\n\nO valor será reintegrado à venda e o saldo devedor recalculado.`
    );
    if (!confirmRestore) return;

    setRestoringId(log.id);
    try {
      const sales = await api.getSales();
      const targetSale = sales.find((s) => s.id === log.saleId);

      if (!targetSale) {
        alert('A venda correspondente não foi encontrada no banco de dados (pode ter sido excluída).');
        setRestoringId(null);
        return;
      }

      const restoredPayment = {
        id: log.paymentId || `pay_restored_${Date.now()}`,
        amount: log.oldAmount,
        paymentDate: log.oldDate || new Date().toISOString(),
        paymentMethod: log.oldMethod || 'Pix',
        notes: `Restaurado via Log de Auditoria em ${new Date().toLocaleDateString('pt-BR')}: ${log.notes || 'Estorno de exclusão acidental'}`,
      };

      const existingPayments = targetSale.payments || [];
      const updatedPayments = [...existingPayments, restoredPayment];
      const newAmountPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
      const newRemaining = Math.max(0, targetSale.totalValue - newAmountPaid);

      await api.updateSale(targetSale.id, {
        amountPaid: newAmountPaid,
        remainingValue: newRemaining,
        payments: updatedPayments,
      });

      // Record a new audit log indicating restoration
      await getPaymentAuditLogs();
      alert(`Sucesso! O pagamento de ${formatCurrencyBR(log.oldAmount)} foi restaurado na venda.`);
      loadLogs();
      if (onPaymentRestored) onPaymentRestored();
    } catch (err) {
      console.error('Erro ao restaurar pagamento:', err);
      alert('Erro ao tentar restaurar o pagamento. Verifique a conexão com o Supabase.');
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-primary to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm text-white">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Histórico de Alterações & Auditoria</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Auditoria
                </span>
              </div>
              <p className="text-xs text-purple-100/80">
                {filterClientName
                  ? `Registros específicos de: ${filterClientName}`
                  : 'Rastreabilidade de quem alterou ou apagou pagamentos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] text-slate-500 font-semibold block">Total</span>
            <span className="text-base font-bold text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm text-center">
            <span className="text-[11px] text-amber-700 font-semibold block">Edições</span>
            <span className="text-base font-bold text-amber-600">{stats.edits}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-sm text-center">
            <span className="text-[11px] text-rose-700 font-semibold block">Exclusões</span>
            <span className="text-base font-bold text-rose-600">{stats.deletes}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm text-center">
            <span className="text-[11px] text-emerald-700 font-semibold block">Novos</span>
            <span className="text-base font-bold text-emerald-600">{stats.creates}</span>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-white">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID da venda, data ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Action filters */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActionFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  actionFilter === 'ALL' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActionFilter('EDIT')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  actionFilter === 'EDIT' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Edições
              </button>
              <button
                onClick={() => setActionFilter('DELETE')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  actionFilter === 'DELETE' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Exclusões
              </button>
            </div>

            {/* Export CSV button */}
            <button
              onClick={() => exportAuditLogsCSV(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              title="Baixar Relatório CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {/* Refresh */}
            <button
              onClick={loadLogs}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
              title="Recarregar logs"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span>Carregando registros de auditoria...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6">
              <ShieldAlert size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum registro de auditoria encontrado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || actionFilter !== 'ALL'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Todas as futuras edições, exclusões e novos lançamentos de pagamentos ficarão registrados aqui automaticamente com data, hora e responsável.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isDelete = log.action === 'DELETE';
              const isEdit = log.action === 'EDIT';
              const isCreate = log.action === 'CREATE';

              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all shadow-xs hover:shadow-md ${
                    isDelete
                      ? 'border-rose-200 hover:border-rose-300'
                      : isEdit
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Top line: Badge + Date + Time + User */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      {isDelete && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                          <Trash2 size={12} />
                          Exclusão de Pagamento
                        </span>
                      )}
                      {isEdit && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Edit3 size={12} />
                          Edição de Pagamento
                        </span>
                      )}
                      {isCreate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <PlusCircle size={12} />
                          Novo Pagamento
                        </span>
                      )}

                      <span className="text-slate-400 font-medium">|</span>

                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                        <Clock size={12} className="text-slate-400" />
                        {log.date} às {log.time}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      <User size={11} className="text-slate-400" />
                      <span className="font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">
                        {log.user}
                      </span>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Left: Client & Sale info */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Cliente:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {log.clientName || 'Cliente não identificado'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">ID da Venda:</span>
                        <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">
                          {log.saleId ? log.saleId.slice(0, 12) + '...' : 'N/A'}
                        </code>
                        {log.saleId && (
                          <button
                            onClick={() => handleCopy(log.saleId, log.id)}
                            className="text-slate-400 hover:text-primary transition-colors"
                            title="Copiar ID da venda"
                          >
                            {copiedId === log.id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>

                      {(log.oldMethod || log.newMethod) && (
                        <div className="text-slate-500">
                          <span className="font-medium">Forma: </span>
                          <span className="text-slate-700 font-semibold">
                            {log.newMethod || log.oldMethod}
                          </span>
                        </div>
                      )}

                      {log.notes && (
                        <div className="text-slate-500 text-[11px] italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                          &quot;{log.notes}&quot;
                        </div>
                      )}
                    </div>

                    {/* Right: Values Changed & Actions */}
                    <div className="flex flex-col justify-between items-start sm:items-end gap-2 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                      <div className="text-left sm:text-right w-full">
                        {isEdit && (
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-slate-400 line-through">
                              Antes: {log.oldAmount !== null ? formatCurrencyBR(log.oldAmount) : 'R$ 0,00'}
                            </div>
                            <div className="text-base font-black text-amber-700 flex items-center sm:justify-end gap-1">
                              <span>Novo: {log.newAmount !== null ? formatCurrencyBR(log.newAmount) : 'R$ 0,00'}</span>
                            </div>
                            {log.oldAmount !== null && log.newAmount !== null && (
                              <div className="text-[10px] text-slate-500">
                                Diferença:{' '}
                                <span
                                  className={
                                    log.newAmount - log.oldAmount >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'
                                  }
                                >
                                  {log.newAmount - log.oldAmount >= 0 ? '+' : ''}
                                  {formatCurrencyBR(log.newAmount - log.oldAmount)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {isDelete && (
                          <div className="space-y-0.5">
                            <div className="text-xs text-rose-600 font-semibold">Valor apagado:</div>
                            <div className="text-base font-black text-rose-700 line-through">
                              {log.oldAmount !== null ? formatCurrencyBR(log.oldAmount) : 'R$ 0,00'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Novo valor desta parcela: <span className="font-bold">R$ 0,00</span>
                            </div>
                          </div>
                        )}

                        {isCreate && (
                          <div className="space-y-0.5">
                            <div className="text-xs text-emerald-600 font-semibold">Lançamento:</div>
                            <div className="text-base font-black text-emerald-700">
                              +{log.newAmount !== null ? formatCurrencyBR(log.newAmount) : 'R$ 0,00'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Restore Button if was deleted! */}
                      {isDelete && log.oldAmount && log.oldAmount > 0 && (
                        <button
                          onClick={() => handleRestorePayment(log)}
                          disabled={restoringId === log.id}
                          className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-98 disabled:opacity-50"
                        >
                          <RotateCcw size={13} className={restoringId === log.id ? 'animate-spin' : ''} />
                          <span>{restoringId === log.id ? 'Restaurando...' : 'Restaurar Pagamento'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Info size={14} className="text-primary shrink-0" />
            <span>
              Armazenamento seguro duplo: salvo no seu navegador e sincronizado se tabela existir no Supabase.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="text-slate-400 hover:text-rose-600 font-medium px-2 py-1 transition-colors text-xs"
              >
                Limpar Histórico Local
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
