"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, Trash2, Send, ToggleLeft, ToggleRight, X, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Community { id: string; name: string; primaryColor: string }
interface Sequence {
  id: string; name: string; trigger: string; isActive: boolean;
  steps: { id: string; stepNumber: number; delayDays: number; subject: string }[];
  _count: { enrollments: number };
}

const TRIGGER_LABELS: Record<string, { label: string; color: string }> = {
  ON_JOIN:             { label: "Ao Entrar",        color: "text-green-400 bg-green-500/10 border-green-500/20" },
  ON_SUBSCRIPTION:     { label: "Ao Assinar",       color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  ON_LESSON_COMPLETE:  { label: "Aula Concluída",   color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  MANUAL:              { label: "Manual",           color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded-xl w-48" />
      <div className="h-10 bg-white/10 rounded-xl w-56" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-white/10 rounded w-40" />
            <div className="h-6 bg-white/10 rounded-full w-24" />
          </div>
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

export default function EmailSequencesPage() {
  const toast = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("ON_JOIN");
  const [creating, setCreating] = useState(false);

  // Broadcast modal
  const [broadcastSeq, setBroadcastSeq] = useState<Sequence | null>(null);
  const [bSubject, setBSubject] = useState("");
  const [bBody, setBBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Sequence | null>(null);

  const token = () => localStorage.getItem("autoclub_access_token") ?? "";

  useEffect(() => {
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) {
          setCommunities(d.data);
          setSelectedCommunity(d.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCommunity) return;
    setLoading(true);
    fetch(`/api/communities/${selectedCommunity.id}/email-sequences`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((d) => d.success && setSequences(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCommunity]);

  async function handleCreate() {
    if (!selectedCommunity || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/email-sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: newName.trim(), trigger: newTrigger }),
      });
      const d = await res.json();
      if (d.success) {
        setSequences((prev) => [d.data, ...prev]);
        setShowCreate(false);
        setNewName("");
        toast.success("Sequência criada com sucesso!");
      } else {
        toast.error(d.error ?? "Erro ao criar sequência");
      }
    } catch {
      toast.error("Erro ao criar sequência");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(seq: Sequence) {
    if (!selectedCommunity) return;
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/email-sequences/${seq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isActive: !seq.isActive }),
      });
      const d = await res.json();
      if (d.success) {
        setSequences((prev) => prev.map((s) => s.id === seq.id ? { ...s, isActive: !s.isActive } : s));
      } else {
        toast.error(d.error ?? "Erro ao atualizar");
      }
    } catch {
      toast.error("Erro ao atualizar sequência");
    }
  }

  async function handleDelete() {
    if (!selectedCommunity || !deleteTarget) return;
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/email-sequences/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await res.json();
      if (d.success) {
        setSequences((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        toast.success("Sequência removida");
      } else {
        toast.error(d.error ?? "Erro ao remover");
      }
    } catch {
      toast.error("Erro ao remover sequência");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleBroadcast() {
    if (!selectedCommunity || !broadcastSeq || !bSubject.trim() || !bBody.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch(
        `/api/communities/${selectedCommunity.id}/email-sequences/${broadcastSeq.id}/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ subject: bSubject.trim(), body: bBody.trim() }),
        }
      );
      const d = await res.json();
      if (d.success) {
        toast.success(`Email enviado para ${d.data.sent} membros!`);
        setBroadcastSeq(null);
        setBSubject("");
        setBBody("");
      } else {
        toast.error(d.error ?? "Erro ao enviar broadcast");
      }
    } catch {
      toast.error("Erro ao enviar broadcast");
    } finally {
      setBroadcasting(false);
    }
  }

  if (loading && sequences.length === 0 && communities.length === 0) return <Skeleton />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sequências de Email</h1>
            <p className="text-gray-400 text-sm">Automações de email para sua comunidade</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!selectedCommunity}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Nova Sequência
        </button>
      </div>

      {/* Community selector */}
      {communities.length > 1 && (
        <div className="relative w-56">
          <select
            value={selectedCommunity?.id ?? ""}
            onChange={(e) => {
              const c = communities.find((c) => c.id === e.target.value);
              if (c) setSelectedCommunity(c);
            }}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id} className="bg-gray-900">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      )}

      {/* Sequence list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-20 bg-white/5" />
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Nenhuma sequência ainda</p>
          <p className="text-gray-500 text-sm">Crie sua primeira sequência de email automática.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => {
            const trig = TRIGGER_LABELS[seq.trigger] ?? { label: seq.trigger, color: "text-gray-400 bg-white/5 border-white/10" };
            return (
              <div key={seq.id} className="glass-card p-5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white">{seq.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${trig.color}`}>
                        {trig.label}
                      </span>
                      {!seq.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-500 bg-white/5">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {seq.steps.length} {seq.steps.length === 1 ? "passo" : "passos"} ·{" "}
                      {seq._count.enrollments} inscrito{seq._count.enrollments !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setBroadcastSeq(seq); setBSubject(""); setBBody(""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                      title="Broadcast"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Broadcast
                    </button>
                    <button
                      onClick={() => handleToggle(seq)}
                      className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                      title={seq.isActive ? "Desativar" : "Ativar"}
                    >
                      {seq.isActive
                        ? <ToggleRight className="w-5 h-5 text-blue-400" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(seq)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nova Sequência</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Boas-vindas ao clube"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Gatilho</label>
              <div className="relative">
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all"
                >
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-gray-900">{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                {creating ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast modal */}
      {broadcastSeq && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Broadcast</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enviar email a todos os membros ativos</p>
              </div>
              <button onClick={() => setBroadcastSeq(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Assunto</label>
              <input
                type="text"
                value={bSubject}
                onChange={(e) => setBSubject(e.target.value)}
                placeholder="Assunto do email"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mensagem</label>
              <textarea
                value={bBody}
                onChange={(e) => setBBody(e.target.value)}
                rows={5}
                placeholder="Conteúdo do email (HTML ou texto)"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setBroadcastSeq(null)}
                className="flex-1 px-4 py-2.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleBroadcast}
                disabled={broadcasting || !bSubject.trim() || !bBody.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Send className="w-4 h-4" />
                {broadcasting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          isOpen
          title="Remover Sequência"
          description={`Tem certeza que deseja remover a sequência "${deleteTarget.name}"? Isso cancelará todas as inscrições ativas.`}
          confirmLabel="Remover"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
