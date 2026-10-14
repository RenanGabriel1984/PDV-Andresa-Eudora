"use client";

import { motion } from "motion/react";
import {
  ChevronDown,
  QrCode,
  Link as LinkIcon,
  Banknote,
  Wallet,
  Info,
} from "lucide-react";
import { Client } from "@/lib/api";

interface VendasOpcoesPagamentoProps {
  selectedClient?: Client;
  totalValue: number;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentStatus: "pago" | "parcial" | "a_receber";
  setPaymentStatus: (status: "pago" | "parcial" | "a_receber") => void;
  amountPaid: string;
  setAmountPaid: (val: string) => void;
  paymentNotes: string;
  setPaymentNotes: (val: string) => void;
  editingSaleId: string | null;

  formatCurrency: (val: number) => string;
  formatPriceInput: (val: string) => string;
  parsePriceInput: (val: string) => number;

  handleFinalizarVenda: () => Promise<void>;
  onBackToCart: () => void;
  onCancelEdit: () => void;
}

export default function VendasOpcoesPagamento({
  selectedClient,
  totalValue,
  paymentMethod,
  setPaymentMethod,
  paymentStatus,
  setPaymentStatus,
  amountPaid,
  setAmountPaid,
  paymentNotes,
  setPaymentNotes,
  editingSaleId,

  formatCurrency,
  formatPriceInput,
  parsePriceInput,

  handleFinalizarVenda,
  onBackToCart,
  onCancelEdit,
}: VendasOpcoesPagamentoProps) {
  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* PAYMENT SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCart}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors"
          >
            <ChevronDown className="rotate-90" size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Pagamento</h2>
        </div>

        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-4">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-600">Cliente</span>
            <span className="font-bold text-slate-900">
              {selectedClient?.name}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total</span>
            <span className="font-bold text-primary">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary italic">
          Forma de Pagamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="Pix"
              checked={paymentMethod === "Pix"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <QrCode
                className={
                  paymentMethod === "Pix"
                    ? "text-gold mb-2"
                    : "text-primary mb-2"
                }
                size={24}
              />
              <span className="text-sm font-semibold">Pix</span>
            </div>
          </label>

          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="Link de Cartão"
              checked={paymentMethod === "Link de Cartão"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <LinkIcon
                className={
                  paymentMethod === "Link de Cartão"
                    ? "text-gold mb-2"
                    : "text-primary mb-2"
                }
                size={24}
              />
              <span className="text-sm font-semibold">Link de Cartão</span>
            </div>
          </label>

          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="À Vista"
              checked={paymentMethod === "À Vista"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <Banknote
                className={
                  paymentMethod === "À Vista"
                    ? "text-gold mb-2"
                    : "text-primary mb-2"
                }
                size={24}
              />
              <span className="text-sm font-semibold">À Vista</span>
            </div>
          </label>

          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="Parcelado 2x"
              checked={paymentMethod === "Parcelado 2x"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <span
                className={`text-lg font-black mb-1 ${paymentMethod === "Parcelado 2x" ? "text-gold" : "text-primary"}`}
              >
                2x
              </span>
              <span className="text-sm font-semibold text-center">
                Parcelado
              </span>
            </div>
          </label>

          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="Parcelado 3x"
              checked={paymentMethod === "Parcelado 3x"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <span
                className={`text-lg font-black mb-1 ${paymentMethod === "Parcelado 3x" ? "text-gold" : "text-primary"}`}
              >
                3x
              </span>
              <span className="text-sm font-semibold text-center">
                Parcelado
              </span>
            </div>
          </label>

          <label className="cursor-pointer group">
            <input
              type="radio"
              name="payment"
              value="Parcelado 4x"
              checked={paymentMethod === "Parcelado 4x"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="peer hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary/10 bg-white peer-checked:border-gold peer-checked:bg-gradient-to-br peer-checked:from-primary/5 peer-checked:to-gold/10 transition-all group-hover:bg-primary/5">
              <span
                className={`text-lg font-black mb-1 ${paymentMethod === "Parcelado 4x" ? "text-gold" : "text-primary"}`}
              >
                4x
              </span>
              <span className="text-sm font-semibold text-center">
                Parcelado
              </span>
            </div>
          </label>
        </div>

        {/* PAYMENT STATUS */}
        <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-primary" size={20} />
            <span className="font-semibold text-slate-700">
              Status do Pagamento
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus("pago")}
              className={`py-2 text-sm font-bold rounded-lg border transition-colors ${paymentStatus === "pago" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Pago
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("parcial")}
              className={`py-2 text-sm font-bold rounded-lg border transition-colors ${paymentStatus === "parcial" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Parcial
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus("a_receber")}
              className={`py-2 text-sm font-bold rounded-lg border transition-colors ${paymentStatus === "a_receber" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              A Receber
            </button>
          </div>

          {paymentStatus === "parcial" && (
            <div className="pt-3 border-t border-slate-100 flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Valor Pago Agora</p>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={amountPaid}
                  onChange={(e) =>
                    setAmountPaid(formatPriceInput(e.target.value))
                  }
                  className="w-full rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm font-bold text-emerald-600"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">
                  Restante (Próx. Mês)
                </p>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 h-10 px-3 flex items-center text-sm font-bold text-orange-500">
                  {formatCurrency(
                    Math.max(
                      0,
                      totalValue -
                        (amountPaid ? parsePriceInput(amountPaid) : 0),
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "a_receber" && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-orange-600 font-medium bg-orange-50 p-2 rounded border border-orange-100">
                O valor total de {formatCurrency(totalValue)} será registrado
                como &quot;Fiado&quot; (A Receber).
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">
              Observações do Pagamento (opcional)
            </p>
            <input
              type="text"
              placeholder="Ex: Entrada do mês, Abatimento..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full rounded-lg border border-primary/20 bg-background-light focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 outline-none text-sm text-slate-700"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-primary/10 bg-white flex items-start gap-3">
          <Info className="text-primary shrink-0" size={24} />
          <p className="text-xs leading-relaxed text-slate-600">
            As opções de parcelamento no cartão estarão disponíveis no link de
            pagamento enviado ao cliente.
          </p>
        </div>
      </section>

      <div className="pt-4 space-y-3">
        <button
          onClick={handleFinalizarVenda}
          className="w-full h-14 bg-gradient-to-r from-primary via-[#a63499] to-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all border-b-4 border-gold/50"
        >
          {editingSaleId ? "Salvar Alterações" : "Finalizar Venda"}
        </button>

        {editingSaleId && (
          <button
            onClick={onCancelEdit}
            className="w-full h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            Cancelar Edição
          </button>
        )}
      </div>
    </motion.div>
  );
}
