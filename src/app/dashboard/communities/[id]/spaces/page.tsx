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
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SpaceType = "DISCUSSION" | "ANNOUNCEMENT" | "QA" | "SHOWCASE";

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
];

const TYPE_COLORS: Record<SpaceType, string> = {
  DISCUSSION:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ANNOUNCEMENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QA:           "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SHOWCASE:     "bg-green-500/10 text-green-400 border-green-500/20",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldClass(extra?: string) {
  return [
    "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400",
    "rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none",
    "focus:ring-2 focus:ring-violet-400/30 transition-all text-sm",
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
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl animate-pulse">
      <div className="w-4 h-4 bg-gray-50 rounded" />
      <div className="w-10 h-10 bg-gray-50 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-gray-50 rounded w-40" />
        <div className="h-3 bg-gray-50 rounded w-56" />
      </div>
      <div className="h-6 bg-gray-50 rounded w-20" />
      <div className="h-8 bg-gray-50 rounded-lg w-16" />
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
      <div className="bg-[#1a2236] border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "create" ? "Novo canal" : "Editar canal"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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
                className="w-16 bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-3 py-3 text-center text-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all"
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
            <p className="text-xs text-gray-600 mt-1">
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
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-gray-200 bg-white hover:border-violet-200",
                  ].join(" ")}
                >
                  <p className={[
                    "text-sm font-medium",
                    form.type === t.value ? "text-violet-300" : "text-gray-600",
                  ].join(" ")}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm text-gray-600">Canal público</p>
              <p className="text-xs text-gray-600">Visível para todos os membros</p>
            </div>
            <button
              type="button"
              onClick={() => setField("isPublic", !form.isPublic)}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                form.isPublic ? "bg-violet-600" : "bg-gray-50",
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
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 hover:text-gray-900 hover:border-violet-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.slug.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
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
      const token = localStorage.getItem("detailhub_access_token");
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
      const token = localStorage.getItem("detailhub_access_token");

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
      const token = localStorage.getItem("detailhub_access_token");
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
      const token = localStorage.getItem("detailhub_access_token") as string;
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
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              Canais
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie os canais de discussão da sua comunidade
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/25 flex-shrink-0"
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

      {/* Summary stats */}
      {!loading && spaces.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SPACE_TYPES.map((t) => {
            const count = spaces.filter((s) => s.type === t.value).length;
            return (
              <div
                key={t.value}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <p className={`text-xs font-medium border rounded px-1.5 py-0.5 inline-block mb-2 ${TYPE_COLORS[t.value]}`}>
                  {t.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
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
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-1">Nenhum canal criado</p>
            <p className="text-gray-600 text-sm mb-4">
              Crie canais para organizar as discussões da sua comunidade.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro canal
            </button>
          </div>
        ) : (
          spaces.map((space) => (
            <div
              key={space.id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-white/[0.07] transition-colors group"
            >
              {/* Drag handle (visual only) */}
              <GripVertical className="w-4 h-4 text-gray-700 flex-shrink-0" />

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                {space.icon ?? <Hash className="w-5 h-5 text-gray-500" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-700 text-sm">
                    {space.name}
                  </span>
                  {space.isDefault && (
                    <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded px-1.5 py-0.5">
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
                    <span className="font-sans ml-2 text-gray-600">
                      — {space.description}
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Lock / Unlock */}
                <button
                  onClick={() => toggleLock(space)}
                  disabled={lockLoading === space.id}
                  title={space.isLocked ? "Desbloquear canal" : "Bloquear canal"}
                  className="p-2 rounded-lg text-gray-600 hover:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
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
                  className="p-2 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteSpace(space)}
                  disabled={space.isDefault || deleteLoading === space.id}
                  title={space.isDefault ? "Não é possível excluir o canal padrão" : "Excluir canal"}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
