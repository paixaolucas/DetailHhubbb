"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Users,
  Layers,
  Send,
} from "lucide-react";
import SequenceEditor, { EmailSequence } from "@/components/email/SequenceEditor";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type TriggerType = "ON_JOIN" | "ON_SUBSCRIPTION" | "ON_LESSON_COMPLETE" | "MANUAL";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  ON_JOIN: "Ao entrar",
  ON_SUBSCRIPTION: "Ao assinar",
  ON_LESSON_COMPLETE: "Ao completar aula",
  MANUAL: "Manual",
};

const TRIGGER_COLORS: Record<TriggerType, string> = {
  ON_JOIN: "bg-green-500/20 text-green-400 border-green-500/20",
  ON_SUBSCRIPTION: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  ON_LESSON_COMPLETE: "bg-purple-500/20 text-purple-400 border-purple-500/20",
  MANUAL: "bg-gray-500/20 text-gray-400 border-gray-500/20",
};

interface SequenceWithMeta extends EmailSequence {
  _count?: { enrollments: number };
  steps?: any[];
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-5 bg-white/10 rounded w-16" />
      </div>
      <div className="h-3 bg-white/10 rounded w-1/4" />
      <div className="flex gap-2">
        <div className="h-7 bg-white/10 rounded w-20" />
        <div className="h-7 bg-white/10 rounded w-20" />
      </div>
    </div>
  );
}

export default function EmailSequencesPage() {
  const params = useParams();
  const communityId = params.id as string;

  const [sequences, setSequences] = useState<SequenceWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SequenceWithMeta | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const fetchSequences = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/communities/${communityId}/email-sequences`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) setSequences(json.data);
    } catch {
      setError("Não foi possível carregar as sequências.");
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleDelete = async (seqId: string) => {
    setConfirmState({
      open: true, title: "Excluir sequência?",
      description: "Esta sequência de emails será removida permanentemente.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        setDeletingId(seqId);
        try {
          const token = localStorage.getItem("detailhub_access_token");
          const res = await fetch(
            `/api/communities/${communityId}/email-sequences/${seqId}`,
            {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          if (res.ok) {
            setSequences((prev) => prev.filter((s) => s.id !== seqId));
          }
        } catch {
          setError("Erro ao excluir. Tente novamente.");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleToggleActive = async (seq: SequenceWithMeta) => {
    setTogglingId(seq.id);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(
        `/api/communities/${communityId}/email-sequences/${seq.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ isActive: !seq.isActive }),
        }
      );
      if (res.ok) {
        setSequences((prev) =>
          prev.map((s) => (s.id === seq.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch {
      // silently fail
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditorSave = () => {
    setShowEditor(false);
    setEditingSequence(undefined);
    fetchSequences();
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingSequence(undefined);
  };

  const openEdit = (seq: SequenceWithMeta) => {
    setEditingSequence(seq);
    setShowEditor(true);
  };

  const openNew = () => {
    setEditingSequence(undefined);
    setShowEditor(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#111827" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/communities/${communityId}/settings`}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-semibold text-white">Email Marketing</h1>
            </div>
          </div>
          {!showEditor && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Sequência
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Editor (inline) */}
        {showEditor && (
          <div className="mb-6 animate-slide-up">
            <SequenceEditor
              communityId={communityId}
              sequence={editingSequence}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
            />
          </div>
        )}

        {/* Sequence list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sequences.length === 0 && !showEditor ? (
          <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">Nenhuma sequência criada</p>
            <p className="text-gray-600 text-sm mb-5">
              Crie sequências de email automatizadas para seus membros
            </p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar primeira sequência
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map((seq) => {
              const trigger = seq.trigger as TriggerType;
              const stepCount = seq.steps?.length ?? 0;
              const enrollCount = seq._count?.enrollments ?? 0;

              return (
                <div
                  key={seq.id}
                  className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {seq.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${TRIGGER_COLORS[trigger]}`}
                        >
                          {TRIGGER_LABELS[trigger]}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {stepCount} {stepCount === 1 ? "passo" : "passos"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {enrollCount} {enrollCount === 1 ? "inscrito" : "inscritos"}
                        </span>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={seq.isActive}
                      onClick={() => handleToggleActive(seq)}
                      disabled={togglingId === seq.id}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        seq.isActive ? "bg-blue-500" : "bg-white/10"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          seq.isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => openEdit(seq)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(seq.id)}
                      disabled={deletingId === seq.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === seq.id ? (
                        <div className="w-3 h-3 border-[1.5px] border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
