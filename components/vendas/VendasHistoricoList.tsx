"use client";

import { motion } from "motion/react";
import {
  Download,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Client, Sale, Payment } from "@/lib/api";

interface VendasHistoricoListProps {
  filteredSales: Sale[];
  clientsById: Record<string, Client>;
  expandedSaleId: string | null;
  setExpandedSaleId: (id: string | null) => void;
  filterDate: string;
  setFilterDate: (val: string) => void;
  filterClient: string;
  setFilterClient: (val: string) => void;
  filterOverdueOnly: boolean;
  setFilterOverdueOnly: (val: boolean) => void;
  overduePendingSalesCount: number;

  formatCurrency: (val: number) => string;
  handleExportExcel: () => void;
  handleExportPDF: () => void;
  onOpenAuditModal: () => void;
  onEditSale: (sale: Sale) => void;
  onWhatsApp: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  onOpenEditPayment: (saleId: string, payment: Payment) => void;
  onUndoPayment: (saleId: string, paymentId: string, amount: number) => void;
}

export default function VendasHistoricoList({
  filteredSales,
  clientsById,
  expandedSaleId,
  setExpandedSaleId,
  filterDate,
  setFilterDate,
  filterClient,
  setFilterClient,
  filterOverdueOnly,
  setFilterOverdueOnly,
  overduePendingSalesCount,

  formatCurrency,
  handleExportExcel,
  handleExportPDF,
  onOpenAuditModal,
  onEditSale,
  onWhatsApp,
  onDeleteSale,
  onOpenEditPayment,
  onUndoPayment,
}: VendasHistoricoListProps) {
  return (
    <motion.div
      key="historico"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <section className="space-y-4">
        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">
              Filtros
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
              >
                <Download size={14} /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={onOpenAuditModal}
                className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                title="Histórico de auditoria de alterações e exclusões de pagamentos"
              >
                <ShieldAlert size={14} /> Auditoria
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm text-slate-700"
            />
            <input
              type="text"
              placeholder="Nome ou ID do cliente"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="flex-1 rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm text-slate-700"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-2">
              {overduePendingSalesCount > 0 && (
                <button
                  onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    filterOverdueOnly
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
                  title="Filtrar apenas vendas pendentes há mais de 30 dias"
                >
                  <AlertTriangle
                    size={13}
                    className={
                      filterOverdueOnly ? "text-white" : "text-amber-600"
                    }
                  />
                  Pendentes (+30 dias): {overduePendingSalesCount}
                </button>
              )}
            </div>

            {(filterDate || filterClient || filterOverdueOnly) && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterClient("");
                  setFilterOverdueOnly(false);
                }}
                className="text-xs text-primary font-bold hover:underline ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* SALES LIST */}
        <div className="space-y-3">
          {filteredSales.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-primary/10">
              <p className="text-slate-500">Nenhuma venda encontrada.</p>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const client = clientsById[sale.clientId];
              const isExpanded = expandedSaleId === sale.id;

              // Status check: 'a receber' or 'parcial'
              const isPending = (sale.remainingValue || 0) > 0;
              const isPartial = isPending && (sale.amountPaid || 0) > 0;
              const isAReceber =
                isPending && (!sale.amountPaid || sale.amountPaid <= 0);

              // Time check: date > 30 days
              const saleDate = sale.date ? new Date(sale.date) : new Date();
              const now = new Date();
              const diffDays = Math.floor(
                (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24),
              );
              const isOver30Days = diffDays > 30;

              // Visual distinction for sales with status 'a receber' or 'parcial' and date > 30 days
              const isOverduePending = (isPartial || isAReceber) && isOver30Days;

              return (
                <div
                  key={sale.id}
                  className={`rounded-xl shadow-sm overflow-hidden transition-all ${
                    isOverduePending
                      ? "bg-gradient-to-r from-amber-50/50 via-white to-white border-2 border-amber-400 border-l-[6px] border-l-amber-500 shadow-amber-500/10 ring-1 ring-amber-400/20"
                      : "bg-white border border-primary/10"
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() =>
                      setExpandedSaleId(isExpanded ? null : sale.id)
                    }
                  >
                    {isOverduePending && (
                      <div className="mb-2.5 flex items-center justify-between bg-amber-100/90 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle
                            size={13}
                            className="text-amber-700 shrink-0"
                          />
                          <span>
                            {isPartial ? "Saldo Parcial" : "A Receber"} em
                            aberto (+30 dias)
                          </span>
                        </div>
                        <span className="flex items-center gap-1 bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px] font-extrabold">
                          <Clock size={11} />
                          {diffDays} dias
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">
                          {client?.name || "Cliente Desconhecido"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.date).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-bold text-primary">
                          {formatCurrency(sale.totalValue)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-slate-500">
                            {sale.paymentMethod}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    {sale.remainingValue > 0 && (
                      <div
                        className={`flex justify-between items-center text-xs pt-3 mt-2 border-t ${
                          isOverduePending
                            ? "border-amber-200"
                            : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 font-semibold">
                            Pago: {formatCurrency(sale.amountPaid)}
                          </span>
                          {isOverduePending && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle
                                size={10}
                                className="text-amber-700"
                              />{" "}
                              +30d pendente
                            </span>
                          )}
                        </div>
                        <span className="text-orange-600 font-bold">
                          Fiado: {formatCurrency(sale.remainingValue)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 p-4 border-t border-primary/10 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Produtos Comprados
                      </h4>
                      {sale.items && sale.items.length > 0 ? (
                        <div className="space-y-2">
                          {sale.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200"
                            >
                              <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-slate-700">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-slate-600 font-medium">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">
                          {sale.productId
                            ? "Produto legado (sem detalhes)"
                            : "Nenhum produto registrado nesta venda."}
                        </p>
                      )}

                      {/* Payment History inside Vendas */}
                      {sale.payments && sale.payments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Histórico de Pagamentos
                          </h4>
                          <div className="space-y-2">
                            {sale.payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex justify-between items-center text-sm bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100"
                              >
                                <div className="flex flex-col">
                                  <span className="text-emerald-700 font-bold">
                                    {new Date(
                                      payment.paymentDate,
                                    ).toLocaleDateString("pt-BR")}
                                    {payment.paymentMethod && (
                                      <span className="ml-2 font-normal">
                                        ({payment.paymentMethod})
                                      </span>
                                    )}
                                  </span>
                                  {payment.notes && (
                                    <span className="text-emerald-600 text-xs">
                                      {payment.notes}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-bold text-emerald-800">
                                    +{formatCurrency(payment.amount)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditPayment(sale.id, payment);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 bg-blue-100/80 p-1.5 rounded transition-colors"
                                    title="Editar valor ou dados deste pagamento"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUndoPayment(
                                        sale.id,
                                        payment.id,
                                        payment.amount,
                                      );
                                    }}
                                    className="text-red-500 hover:text-red-700 bg-red-100/80 p-1.5 rounded transition-colors"
                                    title="Excluir apenas este pagamento"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSale(sale);
                          }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-white border border-primary/20 text-primary hover:bg-primary/5 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWhatsApp(sale);
                          }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                          <MessageCircle size={16} />
                          Recibo
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSale(sale.id);
                          }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </motion.div>
  );
}
