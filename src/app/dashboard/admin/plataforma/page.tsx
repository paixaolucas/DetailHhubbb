"use client";

import { useState, useEffect } from "react";
import { Server, Save, AlertTriangle, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface FeatureFlags {
  cadastros: boolean;
  marketplace: boolean;
  lives: boolean;
  ia: boolean;
  manutencao: boolean;
}

interface PlatformConfig {
  nomePlataforma: string;
  emailSuporte: string;
  comissao: string;
}

const DEFAULT_FLAGS: FeatureFlags = {
  cadastros: true,
  marketplace: true,
  lives: true,
  ia: true,
  manutencao: false,
};

const DEFAULT_CONFIG: PlatformConfig = {
  nomePlataforma: "DetailHub",
  emailSuporte: "suporte@detailhub.com",
  comissao: "15",
};

const FLAG_LABELS: Record<keyof FeatureFlags, { label: string; desc: string }> = {
  cadastros: { label: "Novos Cadastros", desc: "Permite que novos usuários se registrem na plataforma" },
  marketplace: { label: "Marketplace", desc: "Habilita a seção de marketplace para compra e venda" },
  lives: { label: "Lives & Streaming", desc: "Permite criação e transmissão de lives" },
  ia: { label: "Auto IA", desc: "Habilita o assistente de inteligência artificial" },
  manutencao: { label: "Modo Manutenção", desc: "Exibe página de manutenção para usuários não-admin" },
};

export default function PlataformaPage() {
  const toast = useToast();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) return;
    fetch("/api/admin/platform-config", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.data.flags && Object.keys(d.data.flags).length > 0) {
            setFlags({ ...DEFAULT_FLAGS, ...(d.data.flags as Partial<FeatureFlags>) });
          }
          if (d.data.config && Object.keys(d.data.config).length > 0) {
            setConfig({ ...DEFAULT_CONFIG, ...(d.data.config as Partial<PlatformConfig>) });
          }
        }
      })
      .catch(console.error);
  }, []);

  function toggleFlag(key: keyof FeatureFlags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/admin/platform-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ flags, config }),
      });
      const d = await res.json();
      if (d.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error(d.error ?? "Erro ao salvar");
      }
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  function exportConfig() {
    const rows = [
      ["Tipo", "Chave", "Valor"],
      ...Object.entries(flags).map(([k, v]) => ["flag", k, String(v)]),
      ...Object.entries(config).map(([k, v]) => ["config", k, String(v)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platform-config.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function resetCache() {
    setResetting(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/admin/revalidate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Cache reinicializado com sucesso!");
      } else {
        toast.error(d.error ?? "Erro ao resetar cache");
      }
    } catch {
      toast.error("Erro ao resetar cache");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações da Plataforma</h1>
            <p className="text-gray-400 text-sm">Controle global do DetailHub</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 ${
            saved
              ? "bg-green-600 text-white"
              : "bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/30"
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Feature Flags */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Feature Flags</h2>
        <div className="space-y-4">
          {(Object.keys(flags) as (keyof FeatureFlags)[]).map((key) => {
            const { label, desc } = FLAG_LABELS[key];
            const isOn = flags[key];
            const isDanger = key === "manutencao";
            return (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1 pr-4">
                  <p className={`text-sm font-medium ${isDanger && isOn ? "text-red-400" : "text-gray-900"}`}>
                    {label}
                    {isDanger && isOn && (
                      <span className="ml-2 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                        ATIVO
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggleFlag(key)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                    isOn
                      ? isDanger ? "bg-red-500" : "bg-violet-600"
                      : "bg-gray-50"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                      isOn ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Config */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Configurações Gerais</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome da Plataforma</label>
            <input
              type="text"
              value={config.nomePlataforma}
              onChange={(e) => setConfig((c) => ({ ...c, nomePlataforma: e.target.value }))}
              className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email de Suporte</label>
            <input
              type="email"
              value={config.emailSuporte}
              onChange={(e) => setConfig((c) => ({ ...c, emailSuporte: e.target.value }))}
              className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Comissão da Plataforma (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={config.comissao}
              onChange={(e) => setConfig((c) => ({ ...c, comissao: e.target.value }))}
              className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Percentual retido pela plataforma em cada transação
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border border-red-500/20">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-base font-semibold text-red-400">Zona de Perigo</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Exportar dados</p>
              <p className="text-xs text-gray-500 mt-0.5">Exportar todos os dados da plataforma em CSV</p>
            </div>
            <button
              onClick={exportConfig}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded-xl text-sm transition-all hover:bg-violet-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Limpar Cache</p>
              <p className="text-xs text-gray-500 mt-0.5">Reinicializa o cache da aplicação</p>
            </div>
            <button
              onClick={resetCache}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 rounded-xl text-sm transition-all hover:bg-violet-50 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetando..." : "Resetar Cache"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
