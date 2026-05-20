"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Save, Store, QrCode, Image as ImageIcon, ShieldAlert, ChevronRight } from "lucide-react";
import { StoreSettings, getStoreSettings, saveStoreSettings } from "@/lib/storeSettings";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";

export default function ConfiguracoesPage() {
  const { profile, loadingProfile } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "",
    pixKey: "",
    logoUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoreSettings());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSave = () => {
    setIsSaving(true);
    saveStoreSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
      alert("Configurações salvas com sucesso!");
    }, 500);
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
        <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-6 mt-4">
          {profile?.role === "admin" && (
            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Administração de Acesso</h3>
                  <p className="text-xs text-slate-500">Gerenciar vendedores e permissões</p>
                </div>
              </div>
              <Link href="/acessos" className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 w-10 h-10 rounded-full transition-colors">
                <ChevronRight size={20} />
              </Link>
            </div>
          )}

          {profile?.role === "admin" ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Store size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Perfil da Loja
                  </h2>
                  <p className="text-sm text-slate-500">
                    Informações que aparecerão nos recibos
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
                className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                <Save size={20} />
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Store size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Configurações da Loja</h3>
              <p className="text-sm text-slate-500">Apenas o administrador do sistema pode alterar os dados da loja como Nome, Chave PIX e Logo.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
