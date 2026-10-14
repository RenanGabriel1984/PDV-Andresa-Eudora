"use client";

import { Edit, CheckCircle2 } from "lucide-react";
import { Payment } from "@/lib/api";

interface VendasEditPaymentModalProps {
  editingPayment: {
    saleId: string;
    payment: Payment;
  } | null;
  editPaymentAmount: string;
  setEditPaymentAmount: (val: string) => void;
  editPaymentDate: string;
  setEditPaymentDate: (val: string) => void;
  editPaymentMethod: string;
  setEditPaymentMethod: (val: string) => void;
  editPaymentNotes: string;
  setEditPaymentNotes: (val: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  formatPriceInput: (val: string) => string;
}

export default function VendasEditPaymentModal({
  editingPayment,
  editPaymentAmount,
  setEditPaymentAmount,
  editPaymentDate,
  setEditPaymentDate,
  editPaymentMethod,
  setEditPaymentMethod,
  editPaymentNotes,
  setEditPaymentNotes,
  onSave,
  onClose,
  formatPriceInput,
}: VendasEditPaymentModalProps) {
  if (!editingPayment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Edit className="text-primary" size={20} />
            Editar Pagamento
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Valor Pago (R$)
            </label>
            <input
              type="text"
              value={editPaymentAmount}
              onChange={(e) =>
                setEditPaymentAmount(formatPriceInput(e.target.value))
              }
              placeholder="0,00"
              className="w-full h-11 px-3 text-base font-bold text-emerald-600 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="w-full h-11 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Forma de Pagamento
              </label>
              <select
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                className="w-full h-11 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white"
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Crédito</option>
                <option value="Cartão de Débito">Débito</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Observações
            </label>
            <input
              type="text"
              value={editPaymentNotes}
              onChange={(e) => setEditPaymentNotes(e.target.value)}
              placeholder="Ex: Pagamento 1ª parcela, abatimento..."
              className="w-full h-11 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>
              Ao salvar, o saldo restante da venda será recalculado com
              segurança e todos os outros pagamentos continuarão preservados.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onSave}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-sm"
            >
              Salvar Alterações
            </button>
            <button
              onClick={onClose}
              className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl active:scale-95 transition-all text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
