"use client";

// =============================================================================
// Trilhas Manager — Influencer/Admin dashboard for managing course content
// Route: /dashboard/communities/[id]/spaces/[spaceId]/trilhas
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  BookOpen,
  PlayCircle,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";
import { uploadFiles } from "@/utils/upload";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentLesson {
  id: string;
  title: string;
  type: string;
  videoUrl?: string | null;
  videoDuration?: number | null;
  sortOrder: number;
  isPublished: boolean;
  isFree: boolean;
}

interface ContentModule {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isPublished: boolean;
  _count: { lessons: number };
  lessons?: ContentLesson[];
  expanded?: boolean;
  lessonsLoading?: boolean;
}

interface ModuleForm {
  title: string;
  description: string;
  sortOrder: number;
  isPublished: boolean;
}

interface LessonFile {
  url: string;
  name: string;
  size?: number;
}

interface LessonForm {
  title: string;
  videoUrl: string;
  videoDuration: string;
  type: string;
  isFree: boolean;
  isPublished: boolean;
  attachments: LessonFile[];
}

const EMPTY_MODULE: ModuleForm = { title: "", description: "", sortOrder: 0, isPublished: false };
const EMPTY_LESSON: LessonForm = {
  title: "", videoUrl: "", videoDuration: "", type: "VIDEO", isFree: false, isPublished: false, attachments: [],
};

function fieldClass(extra?: string) {
  return [
    "w-full bg-white/5 border border-white/10 hover:border-[#99D3DF] focus:border-[#009CD9]",
    "rounded-xl px-4 py-3 text-[#EEE6E4] placeholder-gray-500 focus:outline-none",
    "focus:ring-2 focus:ring-[#009CD9]/30 transition-all text-sm",
    extra ?? "",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrilhasManagerPage() {
  const params = useParams();
  const communityId = params.id as string;
  const spaceId = params.spaceId as string;

  const [modules, setModules] = useState<ContentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Module form modal
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(EMPTY_MODULE);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");

  // Lesson form: keyed by moduleId
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // File upload
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------

  function authHeader() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" };
  }

  async function loadModules() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/communities/${communityId}/spaces/${spaceId}/modules`, {
        headers: authHeader(),
      });
      const json = await res.json();
      if (json.success) {
        setModules(json.data.map((m: ContentModule) => ({ ...m, expanded: false, lessons: [] })));
      } else {
        setError(json.error ?? "Erro ao carregar módulos.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, spaceId]);

  // ---------------------------------------------------------------------------
  // Load lessons for a module
  // ---------------------------------------------------------------------------

  async function loadLessons(moduleId: string) {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessonsLoading: true } : m))
    );
    try {
      const res = await fetch(
        `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}/lessons`,
        { headers: authHeader() }
      );
      const json = await res.json();
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: json.success ? json.data : [], lessonsLoading: false }
            : m
        )
      );
    } catch {
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, lessonsLoading: false } : m))
      );
    }
  }

  function toggleExpand(moduleId: string) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const willExpand = !m.expanded;
        if (willExpand && !m.lessons?.length && !m.lessonsLoading) {
          loadLessons(moduleId);
        }
        return { ...m, expanded: willExpand };
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Module CRUD
  // ---------------------------------------------------------------------------

  async function handleModuleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModuleLoading(true);
    setModuleError("");
    try {
      const isEdit = !!editingModuleId;
      const url = isEdit
        ? `/api/communities/${communityId}/spaces/${spaceId}/modules/${editingModuleId}`
        : `/api/communities/${communityId}/spaces/${spaceId}/modules`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeader(),
        body: JSON.stringify({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim() || null,
          sortOrder: Number(moduleForm.sortOrder) || 0,
          isPublished: moduleForm.isPublished,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setModuleError(json.error ?? "Erro ao salvar módulo.");
        return;
      }
      if (isEdit) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === editingModuleId
              ? { ...m, ...json.data, lessons: m.lessons, expanded: m.expanded }
              : m
          )
        );
      } else {
        setModules((prev) => [...prev, { ...json.data, lessons: [], expanded: false }]);
      }
      setShowModuleForm(false);
      setEditingModuleId(null);
      setModuleForm(EMPTY_MODULE);
      setSuccess(isEdit ? "Módulo atualizado!" : "Módulo criado!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setModuleError("Erro de conexão.");
    } finally {
      setModuleLoading(false);
    }
  }

  async function deleteModule(moduleId: string, title: string) {
    setConfirmState({
      open: true,
      title: `Excluir módulo "${title}"?`,
      description: "Todas as aulas e o progresso dos membros serão removidos. Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res = await fetch(
            `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}`,
            { method: "DELETE", headers: authHeader() }
          );
          const json = await res.json();
          if (json.success) {
            setModules((prev) => prev.filter((m) => m.id !== moduleId));
            setSuccess("Módulo excluído.");
            setTimeout(() => setSuccess(""), 3000);
          } else {
            setError(json.error ?? "Erro ao excluir módulo.");
          }
        } catch {
          setError("Erro de conexão.");
        }
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Lesson CRUD
  // ---------------------------------------------------------------------------

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingFiles(true);
    try {
      const uploaded = await uploadFiles(files, "lessons");
      const newFiles: LessonFile[] = uploaded.map((f) => ({
        url: f.url,
        name: f.name,
        size: f.size,
      }));
      setLessonForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
    } catch {
      setLessonError("Erro ao fazer upload dos arquivos.");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLessonSubmit(e: React.FormEvent, moduleId: string) {
    e.preventDefault();
    setLessonLoading(true);
    setLessonError("");
    try {
      const isEdit = !!editingLessonId;
      const url = isEdit
        ? `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}/lessons/${editingLessonId}`
        : `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}/lessons`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: authHeader(),
        body: JSON.stringify({
          title: lessonForm.title.trim(),
          videoUrl: lessonForm.videoUrl.trim() || null,
          videoDuration: lessonForm.videoDuration ? Number(lessonForm.videoDuration) : null,
          type: lessonForm.type,
          isFree: lessonForm.isFree,
          isPublished: lessonForm.isPublished,
          attachments: lessonForm.attachments,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setLessonError(json.error ?? "Erro ao salvar aula.");
        return;
      }

      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== moduleId) return m;
          const updatedLessons = isEdit
            ? (m.lessons ?? []).map((l) => (l.id === editingLessonId ? json.data : l))
            : [...(m.lessons ?? []), json.data];
          return { ...m, lessons: updatedLessons, _count: { lessons: updatedLessons.length } };
        })
      );

      setShowLessonForm(null);
      setEditingLessonId(null);
      setLessonForm(EMPTY_LESSON);
      setSuccess(isEdit ? "Aula atualizada!" : "Aula criada!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setLessonError("Erro de conexão.");
    } finally {
      setLessonLoading(false);
    }
  }

  async function deleteLesson(moduleId: string, lessonId: string, title: string) {
    setConfirmState({
      open: true,
      title: `Excluir aula "${title}"?`,
      description: "O progresso dos membros nesta aula será removido.",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          const res = await fetch(
            `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}/lessons/${lessonId}`,
            { method: "DELETE", headers: authHeader() }
          );
          const json = await res.json();
          if (json.success) {
            setModules((prev) =>
              prev.map((m) => {
                if (m.id !== moduleId) return m;
                const updatedLessons = (m.lessons ?? []).filter((l) => l.id !== lessonId);
                return { ...m, lessons: updatedLessons, _count: { lessons: updatedLessons.length } };
              })
            );
          } else {
            setError(json.error ?? "Erro ao excluir aula.");
          }
        } catch {
          setError("Erro de conexão.");
        }
      },
    });
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
            href={`/dashboard/communities/${communityId}/spaces`}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-[#EEE6E4]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#EEE6E4] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#009CD9]" />
              Gerenciar Trilha
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organize módulos e aulas do seu curso
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setModuleForm(EMPTY_MODULE);
            setEditingModuleId(null);
            setModuleError("");
            setShowModuleForm(true);
          }}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo módulo
        </button>
      </div>

      {/* Feedback */}
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
          <button onClick={() => setError("")} className="ml-auto text-red-600 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module form modal */}
      {showModuleForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModuleForm(false); }}
        >
          <div className="bg-[#1a2236] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-[#EEE6E4]">
                {editingModuleId ? "Editar módulo" : "Novo módulo"}
              </h2>
              <button onClick={() => setShowModuleForm(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleModuleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Introdução ao Polimento"
                  required
                  maxLength={120}
                  className={fieldClass()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o que o aluno vai aprender..."
                  rows={3}
                  maxLength={500}
                  className={fieldClass("resize-none")}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    value={moduleForm.sortOrder}
                    onChange={(e) => setModuleForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className={fieldClass()}
                  />
                </div>
                <div className="flex-1 flex items-end">
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl w-full">
                    <div>
                      <p className="text-sm text-gray-400">Publicado</p>
                      <p className="text-xs text-gray-600">Visível para membros</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModuleForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        moduleForm.isPublished ? "bg-[#006079]" : "bg-white/5"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                        moduleForm.isPublished ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {moduleError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {moduleError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModuleForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-[#EEE6E4] hover:border-[#99D3DF] transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={moduleLoading || !moduleForm.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  {moduleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingModuleId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modules list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">Nenhum módulo criado</p>
          <p className="text-gray-500 text-sm mb-4">
            Crie módulos para organizar o conteúdo da sua trilha.
          </p>
          <button
            onClick={() => { setModuleForm(EMPTY_MODULE); setEditingModuleId(null); setShowModuleForm(true); }}
            className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro módulo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module, idx) => (
            <div key={module.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleExpand(module.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#006079]/20 border border-[#006079]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#009CD9]">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#EEE6E4] text-sm truncate">{module.title}</p>
                      {module.isPublished ? (
                        <Eye className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{module._count.lessons} aulas</p>
                  </div>
                  {module.expanded
                    ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  }
                </button>

                {/* Module actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setModuleForm({
                        title: module.title,
                        description: module.description ?? "",
                        sortOrder: module.sortOrder,
                        isPublished: module.isPublished,
                      });
                      setEditingModuleId(module.id);
                      setModuleError("");
                      setShowModuleForm(true);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#009CD9] hover:bg-[#007A99]/10 transition-all"
                    title="Editar módulo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteModule(module.id, module.title)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Excluir módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons (expanded) */}
              {module.expanded && (
                <div className="border-t border-white/10 p-4 space-y-2">
                  {module.lessonsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-[#009CD9] animate-spin" />
                    </div>
                  ) : (
                    <>
                      {(module.lessons ?? []).map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <PlayCircle className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#EEE6E4] truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {!lesson.isPublished && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Rascunho</span>
                              )}
                              {lesson.isFree && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Grátis</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setLessonForm({
                                  title: lesson.title,
                                  videoUrl: lesson.videoUrl ?? "",
                                  videoDuration: lesson.videoDuration?.toString() ?? "",
                                  type: lesson.type,
                                  isFree: lesson.isFree,
                                  isPublished: lesson.isPublished,
                                  attachments: [],
                                });
                                setEditingLessonId(lesson.id);
                                setLessonError("");
                                setShowLessonForm(module.id);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#009CD9] hover:bg-[#007A99]/10 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLesson(module.id, lesson.id, lesson.title)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add lesson button */}
                      <button
                        onClick={() => {
                          setLessonForm(EMPTY_LESSON);
                          setEditingLessonId(null);
                          setLessonError("");
                          setShowLessonForm(module.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 rounded-xl text-sm text-gray-500 hover:border-[#006079]/40 hover:text-[#009CD9] transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar aula
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Lesson form modal for this module */}
              {showLessonForm === module.id && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={(e) => { if (e.target === e.currentTarget) { setShowLessonForm(null); setEditingLessonId(null); } }}
                >
                  <div className="bg-[#1a2236] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#1a2236]">
                      <h2 className="text-base font-semibold text-[#EEE6E4]">
                        {editingLessonId ? "Editar aula" : "Nova aula"}
                      </h2>
                      <button onClick={() => { setShowLessonForm(null); setEditingLessonId(null); }} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={(e) => handleLessonSubmit(e, module.id)} className="p-6 flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Título <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Ex: Preparação da superfície"
                          required
                          maxLength={120}
                          className={fieldClass()}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">URL do vídeo (YouTube/Vimeo)</label>
                        <input
                          type="url"
                          value={lessonForm.videoUrl}
                          onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))}
                          placeholder="https://youtube.com/watch?v=..."
                          className={fieldClass()}
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">Duração (segundos)</label>
                          <input
                            type="number"
                            min={0}
                            value={lessonForm.videoDuration}
                            onChange={(e) => setLessonForm((f) => ({ ...f, videoDuration: e.target.value }))}
                            placeholder="Ex: 720"
                            className={fieldClass()}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo</label>
                          <select
                            value={lessonForm.type}
                            onChange={(e) => setLessonForm((f) => ({ ...f, type: e.target.value }))}
                            className={fieldClass()}
                          >
                            <option value="VIDEO">Vídeo</option>
                            <option value="TEXT">Texto/Artigo</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="LIVE">Ao vivo</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">Grátis</p>
                            <p className="text-xs text-gray-600">Aula de demonstração</p>
                          </div>
                          <button type="button"
                            onClick={() => setLessonForm((f) => ({ ...f, isFree: !f.isFree }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${lessonForm.isFree ? "bg-[#006079]" : "bg-white/5"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${lessonForm.isFree ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                        <div className="flex-1 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">Publicada</p>
                            <p className="text-xs text-gray-600">Visível para membros</p>
                          </div>
                          <button type="button"
                            onClick={() => setLessonForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${lessonForm.isPublished ? "bg-[#006079]" : "bg-white/5"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${lessonForm.isPublished ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                      </div>

                      {/* File attachments */}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                          Arquivos da aula (PDF, DOC, planilhas...)
                        </label>
                        {lessonForm.attachments.length > 0 && (
                          <div className="space-y-1.5 mb-2">
                            {lessonForm.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <FileText className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
                                <span className="flex-1 text-xs text-gray-300 truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setLessonForm((f) => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }))}
                                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <button
                          type="button"
                          disabled={uploadingFiles}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 hover:border-[#006079]/40 rounded-xl text-sm text-gray-500 hover:text-[#009CD9] transition-all disabled:opacity-50"
                        >
                          {uploadingFiles ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                          ) : (
                            <><Upload className="w-4 h-4" /> Adicionar arquivos</>
                          )}
                        </button>
                      </div>

                      {lessonError && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {lessonError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => { setShowLessonForm(null); setEditingLessonId(null); }}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-[#EEE6E4] hover:border-[#99D3DF] transition-all">
                          Cancelar
                        </button>
                        <button type="submit" disabled={lessonLoading || !lessonForm.title.trim()}
                          className="flex-1 py-2.5 rounded-xl bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                          {lessonLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {editingLessonId ? "Salvar" : "Criar aula"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant="danger"
        confirmLabel="Excluir"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
