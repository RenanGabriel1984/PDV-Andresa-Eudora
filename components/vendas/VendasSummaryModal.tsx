"use client";

import { CheckCircle2, X, MapPin } from "lucide-react";
import { Client, Sale } from "@/lib/api";

interface VendasSummaryModalProps {
  isOpen: boolean;
  currentSale: Sale | null;
  selectedClient: Client | null;
  formatCurrency: (val: number) => string;
  onClose: () => void;
  onWhatsApp: () => void;
}

export default function VendasSummaryModal({
  isOpen,
  currentSale,
  selectedClient,
  formatCurrency,
  onClose,
  onWhatsApp,
}: VendasSummaryModalProps) {
  if (!isOpen || !currentSale || !selectedClient) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-500 p-6 text-center text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <CheckCircle2 size={64} className="mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-bold">Venda Finalizada!</h2>
          <p className="text-emerald-100 mt-1">
            A venda foi registrada com sucesso.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Cliente</p>
            <p className="font-bold text-slate-900">{selectedClient.name}</p>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <MapPin size={14} />{" "}
              {selectedClient.address || "Endereço não cadastrado"}
            </p>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
            <p className="text-sm text-slate-500">Produtos</p>
            {currentSale.items?.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-sm"
              >
                <p className="font-bold text-slate-900">
                  {item.quantity}x {item.name}
                </p>
                <p className="font-bold text-primary">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Pagamento: {currentSale.paymentMethod}
            </p>
            {currentSale.remainingValue > 0 ? (
              <>
                <div className="flex justify-between items-center text-emerald-600">
                  <p className="font-semibold">Valor Pago</p>
                  <p className="font-bold">
                    {formatCurrency(currentSale.amountPaid)}
                  </p>
                </div>
                <div className="flex justify-between items-center text-orange-500">
                  <p className="font-semibold">Restante</p>
                  <p className="font-bold">
                    {formatCurrency(currentSale.remainingValue)}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-emerald-600">
                <p className="font-semibold">Valor Pago</p>
                <p className="font-bold">
                  {formatCurrency(currentSale.totalValue)}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onWhatsApp}
            className="w-full h-14 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.087-.115-.708-.941-.708-1.793 0-.852.448-1.271.607-1.441.159-.171.348-.214.463-.214.116 0 .232.001.333.006.106.005.249-.04.389.298.144.347.491 1.2.535 1.287.043.086.072.188.014.304-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.088.275.073.376-.044.101-.117.434-.506.549-.68.116-.174.232-.145.391-.087.158.058 1.012.477 1.186.564.173.088.289.13.333.203.043.073.043.419-.101.824z"></path>
            </svg>
            Enviar Resumo via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
