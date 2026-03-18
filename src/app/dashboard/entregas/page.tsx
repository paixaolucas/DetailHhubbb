"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
  Video,
  Mic,
  MessageSquare,
  ExternalLink,
  Link,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  done: number | boolean;
  required: number | boolean;
}

interface Mention {
  id: string;
  platform: string;
  url: string | null;
  description: string;
  createdAt: string;
}

interface HistoryMonth {
  year: number;
  month: number;
  label: string;
  completionPct: number;
  completed: number;
  required: number;
}

interface EntregasData {
  period: { year: number; month: number };
  checklist: {
    videos: ChecklistItem;
    lives: ChecklistItem;
    forumInteractions: ChecklistItem;
    mentions: ChecklistItem;
    bioLink: { done: boolean; required: boolean };
  };
  completedItems: number;
  totalItems: number;
  completionPct: number;
  mentions: Mention[];
  bioLinkConfirmed: boolean;
  history: HistoryMonth[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  other: "Outro",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  youtube: Youtube,
  whatsapp: MessageSquare,
  tiktok: Video,
  other: ExternalLink,
};

function monthName(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({
  icon: Icon,
  label,
  sublabel,
  done,
  required,
  isBoolean = false,
  auto = true,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  done: number | boolean;
  required: number | boolean;
  isBoolean?: boolean;
  auto?: boolean;
}) {
  const ok = isBoolean ? Boolean(done) : Number(done) >= Number(required);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${ok ? "border-green-200 bg-green-50" : "border-white/10 bg-white/5"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? "bg-green-100" : "bg-white/5 border border-white/10"}`}>
        <Icon className={`w-5 h-5 ${ok ? "text-green-600" : "text-gray-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-[#EEE6E4]">{label}</p>
          {!auto && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#006079]/10 text-[#009CD9] border border-[#006079]/20">
              manual
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isBoolean && (
          <span className={`text-sm font-bold ${ok ? "text-green-600" : "text-gray-400"}`}>
            {String(done)}/{String(required)}
          </span>
        )}
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
    </div>
  );
}

function HistoryBar({ month }: { month: HistoryMonth }) {
  const pct = month.completionPct;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="text-center">
      <div className="w-full bg-white/5 rounded-full h-16 flex flex-col-reverse mx-auto relative overflow-hidden">
        <div
          className="rounded-full transition-all"
          style={{ height: `${pct}%`, backgroundColor: color, minHeight: pct > 0 ? 4 : 0 }}
        />
      </div>
      <p className="text-xs font-semibold mt-1" style={{ color }}>{pct}%</p>
      <p className="text-xs text-gray-400">{month.label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EntregasPage() {
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<EntregasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioUpdating, setBioUpdating] = useState(false);

  // Mention form
  const [mentionForm, setMentionForm] = useState({
    platform: "instagram" as string,
    description: "",
    url: "",
  });
  const [mentionSaving, setMentionSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const token = localStorage.getItem("detailhub_access_token");
    fetch(`/api/influencers/me/entregas?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  async function toggleBioLink() {
    if (!data) return;
    setBioUpdating(true);
    const token = localStorage.getItem("detailhub_access_token");
    try {
      const res = await fetch("/api/influencers/me/entregas/bio-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmed: !data.bioLinkConfirmed }),
      });
      const d = await res.json();
      if (d.success) {
        setData((prev) => prev ? { ...prev, bioLinkConfirmed: d.data.bioLinkConfirmed } : prev);
      }
    } finally {
      setBioUpdating(false);
    }
  }

  async function addMention(e: React.FormEvent) {
    e.preventDefault();
    if (!mentionForm.description.trim()) return;
    setMentionSaving(true);
    const token = localStorage.getItem("detailhub_access_token");
    try {
      const res = await fetch("/api/influencers/me/entregas/mencoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...mentionForm, year, month }),
      });
      const d = await res.json();
      if (d.success) {
        setMentionForm({ platform: "instagram", description: "", url: "" });
        setShowForm(false);
        fetchData();
        toast.success("Menção registrada!");
      } else {
        toast.error(d.error ?? "Erro ao registrar menção");
      }
    } finally {
      setMentionSaving(false);
    }
  }

  async function deleteMention(id: string) {
    const token = localStorage.getItem("detailhub_access_token");
    const res = await fetch(`/api/influencers/me/entregas/mencoes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { fetchData(); toast.success("Menção removida"); }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Entregas do Mês</h1>
        <p className="text-gray-400 text-sm mt-1">
          Acompanhe o cumprimento do contrato mínimo mensal
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between glass-card px-4 py-3">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-[#006079]/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#EEE6E4] capitalize">
            {monthName(year, month)}
          </p>
          {isCurrentMonth && (
            <span className="text-xs text-[#007A99] font-medium">mês atual — ao vivo</span>
          )}
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 hover:bg-[#006079]/10 rounded-lg transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <div className="glass-card p-8 text-center text-gray-500 text-sm">Sem dados</div>
      ) : (
        <>
          {/* Overall progress */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#EEE6E4]">Progresso geral</p>
              <span className={`text-sm font-bold ${data.completionPct === 100 ? "text-green-600" : "text-amber-500"}`}>
                {data.completedItems}/{data.totalItems} itens
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: `${data.completionPct}%`,
                  backgroundColor: data.completionPct === 100 ? "#10b981" : "#f59e0b",
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{data.completionPct}% do contrato cumprido este mês</p>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Rastreado automaticamente</p>
            <CheckRow
              icon={Video}
              label="Vídeos exclusivos para membros"
              sublabel={`Mínimo 10 minutos, publicados na plataforma`}
              done={data.checklist.videos.done as number}
              required={data.checklist.videos.required as number}
            />
            <CheckRow
              icon={Mic}
              label="Live ou Q&A com a comunidade"
              sublabel="Mínimo 30 minutos, realizada dentro da plataforma"
              done={data.checklist.lives.done as number}
              required={data.checklist.lives.required as number}
            />
            <CheckRow
              icon={MessageSquare}
              label="Interações no fórum / chat"
              sublabel="Posts + comentários seus nas suas comunidades"
              done={data.checklist.forumInteractions.done as number}
              required={data.checklist.forumInteractions.required as number}
            />

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 pt-2">Registro manual</p>
            <CheckRow
              icon={ExternalLink}
              label="Menções externas à plataforma"
              sublabel="Stories, vídeos ou posts em redes externas citando a plataforma"
              done={data.checklist.mentions.done as number}
              required={data.checklist.mentions.required as number}
              auto={false}
            />

            {/* Bio link — toggle */}
            <div
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${data.bioLinkConfirmed ? "border-green-200 bg-green-50" : "border-white/10 bg-white/5"}`}
              onClick={!bioUpdating ? toggleBioLink : undefined}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${data.bioLinkConfirmed ? "bg-green-100" : "bg-white/5 border border-white/10"}`}>
                <Link className={`w-5 h-5 ${data.bioLinkConfirmed ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#EEE6E4]">Link ativo na bio</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#006079]/10 text-[#009CD9] border border-[#006079]/20">manual</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Link permanente para a plataforma nas suas redes (Instagram, YouTube, etc.)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {bioUpdating ? (
                  <div className="w-4 h-4 border-2 border-[#009CD9] border-t-transparent rounded-full animate-spin" />
                ) : data.bioLinkConfirmed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {/* External mentions list + form */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#EEE6E4]">Menções externas registradas</h2>
                <p className="text-xs text-gray-400">{data.mentions.length} / 2 mínimo este mês</p>
              </div>
              {isCurrentMonth && (
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006079] hover:bg-[#007A99] text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar
                </button>
              )}
            </div>

            {/* Add form */}
            {showForm && (
              <form onSubmit={addMention} className="border border-violet-100 rounded-xl p-4 bg-[#006079]/10/50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Plataforma</label>
                    <select
                      value={mentionForm.platform}
                      onChange={(e) => setMentionForm((f) => ({ ...f, platform: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#EEE6E4] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9]"
                    >
                      {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Link (opcional)</label>
                    <input
                      type="url"
                      value={mentionForm.url}
                      onChange={(e) => setMentionForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#EEE6E4] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={mentionForm.description}
                    onChange={(e) => setMentionForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Story no Instagram com swipe up para a plataforma"
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#EEE6E4] focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 focus:border-[#009CD9]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mentionSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {mentionSaving ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Salvar
                  </button>
                </div>
              </form>
            )}

            {/* Mentions list */}
            {data.mentions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhuma menção registrada este mês.
              </p>
            ) : (
              <div className="space-y-2">
                {data.mentions.map((m) => {
                  const PlatformIcon = PLATFORM_ICONS[m.platform] ?? ExternalLink;
                  return (
                    <div key={m.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PlatformIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500">{PLATFORM_LABELS[m.platform]}</p>
                        <p className="text-sm text-[#EEE6E4] mt-0.5">{m.description}</p>
                        {m.url && (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#007A99] hover:underline mt-0.5 block truncate"
                          >
                            {m.url}
                          </a>
                        )}
                      </div>
                      {isCurrentMonth && (
                        <button
                          onClick={() => deleteMention(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History bars */}
          {data.history.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#EEE6E4] mb-4">Histórico de cumprimento</h2>
              <div className="grid grid-cols-6 gap-2">
                {data.history.map((h) => (
                  <HistoryBar key={`${h.year}-${h.month}`} month={h} />
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="glass-card p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#009CD9] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-300">Atenção:</strong> menções externas e link na bio são registrados manualmente e dependem de boa-fé. Entregas rastreadas automaticamente (vídeos, lives e fórum) têm verificação direta da plataforma e contam para a Pontuação de Performance (PP).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
