"use client";

// =============================================================================
// Dashboard — Community Spaces Manager
// Route: /dashboard/communities/[id]/spaces
// Influencer can create, edit, and delete spaces for their community
// =============================================================================

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Hash,
  Check,
  X,
  Layers,
  Lock,
  Unlock,
  AlertCircle,
  GripVertical,
  BookOpen,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SpaceType = "DISCUSSION" | "ANNOUNCEMENT" | "QA" | "SHOWCASE" | "COURSE";

interface Space {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  type: SpaceType;
  isPublic: boolean;
  isLocked: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

interface SpaceForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  type: SpaceType;
  isPublic: boolean;
}

const EMPTY_FORM: SpaceForm = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  type: "DISCUSSION",
  isPublic: true,
};

const SPACE_TYPES: { value: SpaceType; label: string; description: string }[] = [
  { value: "DISCUSSION",   label: "Discussão",  description: "Tópicos gerais e conversas"      },
  { value: "ANNOUNCEMENT", label: "Avisos",     description: "Avisos do administrador"          },
  { value: "QA",           label: "Perguntas",  description: "Dúvidas e respostas"              },
  { value: "SHOWCASE",     label: "Showcase",   description: "Compartilhe seu trabalho"         },
  { value: "COURSE",       label: "Trilha",     description: "Módulos e aulas em sequência"     },
];

const TYPE_COLORS: Record<SpaceType, string> = {
  DISCUSSION:   "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20",
  ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QA:           "bg-[#007A99]/10 text-[#009CD9] border-[#007A99]/20",
  SHOWCASE:     "bg-green-500/10 text-green-400 border-green-500/20",
  COURSE:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldClass(extra?: string) {
  return [
    "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9]",
    "rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none",
    "focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm",
    extra ?? "",
  ].join(" ");
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SpaceSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
      <div className="w-4 h-4 bg-white/5 rounded" />
      <div className="w-10 h-10 bg-white/5 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-white/5 rounded w-40" />
        <div className="h-3 bg-white/5 rounded w-56" />
      </div>
      <div className="h-6 bg-white/5 rounded w-20" />
      <div className="h-8 bg-white/5 rounded-lg w-16" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit Modal
// ---------------------------------------------------------------------------

interface SpaceModalProps {
  mode: "create" | "edit";
  initial: SpaceForm;
  loading: boolean;
  error: string;
  onSubmit: (form: SpaceForm) => void;
  onClose: () => void;
}

function SpaceModal({
  mode,
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: SpaceModalProps) {
  const [form, setForm] = useState<SpaceForm>(initial);
  const [slugManual, setSlugManual] = useState(mode === "edit");

  function setField<K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugManual) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a2236] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-[#EEE6E4]">
            {mode === "create" ? "Novo canal" : "Editar canal"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="p-6 flex flex-col gap-4"
        >
          {/* Name + icon */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Ícone (emoji)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value.slice(0, 2))}
                placeholder="🔥"
                className="w-16 bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9] rounded-xl px-3 py-3 text-center text-xl focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex: Apresentações"
                required
                maxLength={80}
                className={fieldClass()}
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Slug (URL) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setField("slug", toSlug(e.target.value));
              }}
              placeholder="apresentacoes"
              required
              maxLength={80}
              pattern="[a-z0-9-]+"
              className={fieldClass("font-mono")}
            />
            <p className="text-xs text-gray-400 mt-1">
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descreva o propósito deste canal..."
              rows={2}
              maxLength={300}
              className={fieldClass("resize-none")}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setField("type", t.value)}
                  className={[
                    "text-left p-3 rounded-xl border transition-all",
                    form.type === t.value
                      ? "border-[#007A99]/50 bg-[#007A99]/10"
                      : "border-white/10 bg-white/5 hover:border-[#99D3DF]",
                  ].join(" ")}
                >
                  <p className={[
                    "text-sm font-medium",
                    form.type === t.value ? "text-[#33A7BF]" : "text-gray-400",
                  ].join(" ")}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <p className="text-sm text-gray-400">Canal público</p>
              <p className="text-xs text-gray-400">Visível para todos os membros</p>
            </div>
            <button
              type="button"
              onClick={() => setField("isPublic", !form.isPublic)}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                form.isPublic ? "bg-[#006079]" : "bg-white/5",
              ].join(" ")}
              role="switch"
              aria-checked={form.isPublic}
            >
              <span
                className={[
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md",
                  form.isPublic ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-[#EEE6E4] hover:border-[#99D3DF] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.slug.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {mode === "create" ? "Criar canal" : "Salvar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunitySpacesPage() {
  const params = useParams();
  const communityId = params.id as string;

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [modalForm, setModalForm] = useState<SpaceForm>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Inline action loading
  const [lockLoading, setLockLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  async function loadSpaces() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/communities/${communityId}/spaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSpaces(json.data ?? []);
      } else {
        setError(json.error ?? "Erro ao carregar canais.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Create ----------------------------------------------------------------

  function openCreate() {
    setModalMode("create");
    setModalForm(EMPTY_FORM);
    setModalError("");
    setEditingSpace(null);
    setShowModal(true);
  }

  // ---- Edit ------------------------------------------------------------------

  function openEdit(space: Space) {
    setModalMode("edit");
    setModalForm({
      name: space.name,
      slug: space.slug,
      description: space.description ?? "",
      icon: space.icon ?? "",
      type: space.type,
      isPublic: space.isPublic,
    });
    setModalError("");
    setEditingSpace(space);
    setShowModal(true);
  }

  // ---- Submit (create or edit) -----------------------------------------------

  async function handleModalSubmit(form: SpaceForm) {
    setModalLoading(true);
    setModalError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (modalMode === "create") {
        const res = await fetch(`/api/communities/${communityId}/spaces`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || undefined,
            icon: form.icon.trim() || undefined,
            type: form.type,
            isPublic: form.isPublic,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setModalError(json.error ?? "Erro ao criar canal.");
          return;
        }
        setSpaces((prev) => [...prev, json.data]);
        setSuccess("Canal criado com sucesso!");
      } else {
        if (!editingSpace) return;
        const res = await fetch(
          `/api/communities/${communityId}/spaces/${editingSpace.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: form.name.trim(),
              description: form.description.trim() || undefined,
              icon: form.icon.trim() || undefined,
              type: form.type,
              isPublic: form.isPublic,
            }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          setModalError(json.error ?? "Erro ao salvar.");
          return;
        }
        setSpaces((prev) =>
          prev.map((s) => (s.id === editingSpace.id ? json.data : s))
        );
        setSuccess("Canal atualizado!");
      }

      setShowModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setModalError("Erro de conexão.");
    } finally {
      setModalLoading(false);
    }
  }

  // ---- Toggle lock -----------------------------------------------------------

  async function toggleLock(space: Space) {
    setLockLoading(space.id);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(
        `/api/communities/${communityId}/spaces/${space.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isLocked: !space.isLocked }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === space.id ? json.data : s))
        );
      }
    } catch {
      // silent
    } finally {
      setLockLoading(null);
    }
  }

  // ---- Delete ----------------------------------------------------------------

  async function deleteSpace(space: Space) {
    if (space.isDefault) {
      setError("Não é possível excluir o canal padrão.");
      return;
    }
    setConfirmState({
      open: true,
      title: `Excluir canal "${space.name}"?`,
      description: "Todos os posts serão removidos permanentemente. Esta ação não pode ser desfeita.",
      variant: "danger",
      onConfirm: () => {
        setConfirmState((s) => ({ ...s, open: false }));
        doDeleteSpace(space);
      },
    });
  }

  async function doDeleteSpace(space: Space) {

    setDeleteLoading(space.id);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) as string;
      const res = await fetch(
        `/api/communities/${communityId}/spaces/${space.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setSpaces((prev) => prev.filter((s) => s.id !== space.id));
        setSuccess("Canal excluído.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const json = await res.json();
        setError(json.error ?? "Erro ao excluir.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setDeleteLoading(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/communities/${communityId}/settings`}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-[#EEE6E4]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#EEE6E4] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#009CD9]" />
              Canais
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Máximo de 3 canais por comunidade{!loading && ` — ${spaces.length}/3 usados`}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={spaces.length >= 3}
          title={spaces.length >= 3 ? "Limite de 3 canais atingido" : "Criar novo canal"}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#007A99]/25 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo canal
        </button>
      </div>

      {/* Toast messages */}
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-600 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3-slot visual overview */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Canal Geral",   desc: "Discussão livre entre membros",      icon: "💬", type: "DISCUSSION"   },
            { label: "Avisos",        desc: "Comunicados e novidades",             icon: "📢", type: "ANNOUNCEMENT" },
            { label: "Conteúdo",      desc: "Dicas, tutoriais e referências",      icon: "🎓", type: "DISCUSSION"   },
          ] as const).map((slot, idx) => {
            const filled = spaces[idx];
            return (
              <div
                key={idx}
                className={[
                  "rounded-xl border p-4 transition-all text-center",
                  filled
                    ? "bg-[#006079]/10 border-[#006079]/30"
                    : "bg-white/[0.02] border-dashed border-white/10",
                ].join(" ")}
              >
                <div className="text-2xl mb-2">{filled?.icon ?? slot.icon}</div>
                <p className="text-xs font-semibold text-[#EEE6E4] truncate">
                  {filled?.name ?? slot.label}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                  {filled ? `/${filled.slug}` : slot.desc}
                </p>
                {filled ? (
                  <span className={`mt-2 inline-block text-[10px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[filled.type]}`}>
                    {SPACE_TYPES.find((t) => t.value === filled.type)?.label}
                  </span>
                ) : (
                  <span className="mt-2 inline-block text-[10px] text-gray-600">vazio</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Spaces list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SpaceSkeleton key={i} />)
        ) : spaces.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-1">Nenhum canal criado</p>
            <p className="text-gray-400 text-sm mb-4">
              Crie canais para organizar as discussões da sua comunidade.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro canal
            </button>
          </div>
        ) : (
          spaces.map((space) => (
            <div
              key={space.id}
              className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors group"
            >
              {/* Drag handle (visual only) */}
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                {space.icon ?? <Hash className="w-5 h-5 text-gray-500" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-300 text-sm">
                    {space.name}
                  </span>
                  {space.isDefault && (
                    <span className="text-[10px] bg-[#007A99]/10 text-[#009CD9] border border-[#007A99]/20 rounded px-1.5 py-0.5">
                      Padrão
                    </span>
                  )}
                  {space.isLocked && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Bloqueado
                    </span>
                  )}
                  {!space.isPublic && (
                    <span className="text-[10px] bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded px-1.5 py-0.5">
                      Privado
                    </span>
                  )}
                  <span
                    className={`text-[10px] border rounded px-1.5 py-0.5 ${TYPE_COLORS[space.type]}`}
                  >
                    {SPACE_TYPES.find((t) => t.value === space.type)?.label ?? space.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  /{space.slug}
                  {space.description && (
                    <span className="font-sans ml-2 text-gray-400">
                      — {space.description}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Manage Trilhas (COURSE type only) */}
                {space.type === "COURSE" && (
                  <Link
                    href={`/dashboard/communities/${communityId}/spaces/${space.id}/trilhas`}
                    title="Gerenciar trilhas"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#009CD9] hover:bg-[#007A99]/10 transition-all flex items-center"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                )}

                {/* Lock / Unlock */}
                <button
                  onClick={() => toggleLock(space)}
                  disabled={lockLoading === space.id}
                  title={space.isLocked ? "Desbloquear canal" : "Bloquear canal"}
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                >
                  {lockLoading === space.id ? (
                    <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin block" />
                  ) : space.isLocked ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(space)}
                  title="Editar canal"
                  className="p-2 rounded-lg text-gray-400 hover:text-[#009CD9] hover:bg-[#007A99]/10 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteSpace(space)}
                  disabled={space.isDefault || deleteLoading === space.id}
                  title={space.isDefault ? "Não é possível excluir o canal padrão" : "Excluir canal"}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {deleteLoading === space.id ? (
                    <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin block" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <SpaceModal
          mode={modalMode}
          initial={modalForm}
          loading={modalLoading}
          error={modalError}
          onSubmit={handleModalSubmit}
          onClose={() => { setShowModal(false); setModalError(""); }}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        confirmLabel="Excluir"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
