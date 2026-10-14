"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  Save,
  Store,
  QrCode,
  Image as ImageIcon,
  ShieldAlert,
  Download,
  User,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from "lucide-react";
import { StoreSettings, getStoreSettings, saveStoreSettings } from "@/lib/storeSettings";
import {
  getLocalAuditLogs,
  exportAuditLogsCSV,
  PaymentAuditLog,
} from "@/lib/auditLog";
import PaymentAuditModal from "@/components/PaymentAuditModal";

export default function ConfiguracoesPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "",
    pixKey: "",
    logoUrl: "",
  });
  const [operatorName, setOperatorName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditStats, setAuditStats] = useState({ total: 0, edits: 0, deletes: 0 });
  const [showSqlInstructions, setShowSqlInstructions] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoreSettings());
    const op = localStorage.getItem("current_operator_name") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOperatorName(op);

    // Load audit logs summary
    const logs = getLocalAuditLogs();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuditStats({
      total: logs.length,
      edits: logs.filter((l) => l.action === "EDIT").length,
      deletes: logs.filter((l) => l.action === "DELETE").length,
    });

    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSave = () => {
    setIsSaving(true);
    saveStoreSettings(settings);
    if (operatorName.trim()) {
      localStorage.setItem("current_operator_name", operatorName.trim());
    } else {
      localStorage.removeItem("current_operator_name");
    }

    setTimeout(() => {
      setIsSaving(false);
      alert("Configurações salvas com sucesso!");
    }, 400);
  };

  const handleExportCSV = () => {
    const logs = getLocalAuditLogs();
    if (logs.length === 0) {
      alert("Nenhum registro de auditoria gravado ainda.");
      return;
    }
    exportAuditLogsCSV(logs);
  };

  const sqlScript = `-- Código SQL para criar a tabela de Auditoria no Supabase
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date_str TEXT,
  time_str TEXT,
  action TEXT NOT NULL,
  user_email TEXT,
  sale_id TEXT,
  client_id TEXT,
  client_name TEXT,
  payment_id TEXT,
  old_amount NUMERIC(12, 2),
  new_amount NUMERIC(12, 2),
  old_method TEXT,
  new_method TEXT,
  notes TEXT,
  description TEXT
);

-- Habilitar segurança de linha (RLS) e permissões de acesso
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de auditoria" ON public.payment_audit_logs FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de auditoria" ON public.payment_audit_logs FOR INSERT WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <Header
        showMenu
        showNotifications
        showProfile
        title="Configurações"
        bgColor="bg-primary"
        textColor="text-white"
      />

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-6 mt-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Perfil da Loja & Operador
              </h2>
              <p className="text-sm text-slate-500">
                Informações para recibos e identificação na auditoria
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Store size={16} className="text-slate-400" />
                Nome da Loja
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) =>
                  setSettings({ ...settings, storeName: e.target.value })
                }
                placeholder="Ex: Minha Loja"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 outline-none text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Nome do Operador / Vendedor(a) Padrão
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Ex: Renan (usado no registro de quem alterou pagamentos)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 outline-none text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Este nome será gravado automaticamente nos registros de auditoria quando um pagamento for editado ou excluído.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <QrCode size={16} className="text-slate-400" />
                Chave PIX
              </label>
              <input
                type="text"
                value={settings.pixKey}
                onChange={(e) =>
                  setSettings({ ...settings, pixKey: e.target.value })
                }
                placeholder="Ex: 123.456.789-00 ou email@loja.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 outline-none text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon size={16} className="text-slate-400" />
                URL do Logo (Opcional)
              </label>
              <input
                type="text"
                value={settings.logoUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, logoUrl: e.target.value })
                }
                placeholder="https://exemplo.com/logo.png"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 outline-none text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-70 shadow-md shadow-primary/20"
          >
            <Save size={20} />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        {/* AUDIT LOG SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-purple-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Histórico de Alterações & Auditoria
                </h2>
                <p className="text-sm text-slate-500">
                  Rastreabilidade e prevenção contra exclusões acidentais
                </p>
              </div>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
              Ativo
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Todas as alterações ou exclusões de pagamentos são registradas automaticamente com <strong>data</strong>, <strong>hora</strong>, <strong>valor antigo</strong>, <strong>novo valor</strong>, <strong>ID da venda</strong> e <strong>quem realizou a ação</strong>.
          </p>

          {/* Quick Counter */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Registros</span>
              <span className="text-base font-bold text-slate-800">{auditStats.total}</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <span className="text-amber-700 block text-[11px]">Edições</span>
              <span className="text-base font-bold text-amber-700">{auditStats.edits}</span>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <span className="text-rose-700 block text-[11px]">Exclusões</span>
              <span className="text-base font-bold text-rose-700">{auditStats.deletes}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex-1 h-12 bg-gradient-to-r from-purple-900 to-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-md shadow-purple-900/10 text-sm"
            >
              <ShieldAlert size={18} />
              Abrir Histórico Completo
            </button>
            <button
              onClick={handleExportCSV}
              className="h-12 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <FileSpreadsheet size={18} />
              Exportar CSV
            </button>
          </div>

          {/* Optional Supabase Cloud Sync Info */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <button
              onClick={() => setShowSqlInstructions(!showSqlInstructions)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Database size={15} className="text-purple-600" />
                <span>Salvar também na nuvem do Supabase (Opcional)</span>
              </div>
              {showSqlInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSqlInstructions && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                <p className="text-slate-600">
                  Os logs já estão salvos e 100% seguros no armazenamento local do navegador. Se você quiser também sincronizar com o banco de dados Supabase na nuvem, execute o script SQL abaixo no <strong>SQL Editor</strong> do seu painel Supabase:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                    {sqlScript}
                  </pre>
                  <button
                    onClick={handleCopySql}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-sm transition-colors"
                  >
                    {sqlCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {sqlCopied ? "Copiado!" : "Copiar SQL"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PaymentAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          // Refresh stats
          const logs = getLocalAuditLogs();
          setAuditStats({
            total: logs.length,
            edits: logs.filter((l) => l.action === "EDIT").length,
            deletes: logs.filter((l) => l.action === "DELETE").length,
          });
        }}
      />
    </div>
  );
}
