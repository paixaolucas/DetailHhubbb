"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Plus, ChevronDown, ChevronRight, PlayCircle, FileText,
  Headphones, Star, Award, Trash2, Eye, EyeOff, GripVertical, Video, Pencil, Check, X,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const LESSON_ICONS: Record<string, React.ElementType> = {
  VIDEO: PlayCircle, AUDIO: Headphones, TEXT: FileText,
  PDF: FileText, QUIZ: Star, ASSIGNMENT: Award, LIVE_REPLAY: Video,
};

const CONTENT_TYPES = [
  { value: "VIDEO", label: "Vídeo" },
  { value: "AUDIO", label: "Áudio" },
  { value: "TEXT", label: "Texto" },
  { value: "PDF", label: "PDF" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Tarefa" },
];

interface Lesson {
  id: string; title: string; type: string;
  videoDuration: number | null; isPublished: boolean;
  isFree: boolean; viewCount: number; completionCount: number; sortOrder: number;
}

interface Module {
  id: string; title: string; description: string | null;
  isPublished: boolean; sortOrder: number; unlockAfterDays: number | null;
  lessons: Lesson[]; _count: { lessons: number };
}

interface Community { id: string; name: string; primaryColor: string; }

function fieldClass() {
  return "w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-400 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-sm";
}

export default function ContentPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showNewModule, setShowNewModule] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLesson, setNewLesson] = useState({ title: "", type: "VIDEO", videoUrl: "", isFree: false });
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string;
    variant?: "danger" | "default"; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Edit state
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleForm, setEditModuleForm] = useState({ title: "", description: "" });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: "", type: "VIDEO", videoUrl: "", isFree: false, unlockAfterDays: "" });

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    fetch("/api/communities/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) {
          setCommunities(d.data);
          setSelectedCommunity(d.data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedCommunity) return;
    setIsLoading(true);
    const token = localStorage.getItem("detailhub_access_token");
    fetch(`/api/content/modules?communityId=${selectedCommunity}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => d.success && setModules(d.data ?? []))
      .finally(() => setIsLoading(false));
  }, [selectedCommunity]);

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  }

  async function createModule() {
    if (!newModuleTitle.trim() || !selectedCommunity) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/content/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ communityId: selectedCommunity, title: newModuleTitle.trim(), sortOrder: modules.length }),
      });
      const data = await res.json();
      if (data.success) {
        setModules((prev) => [...prev, { ...data.data, lessons: [], _count: { lessons: 0 } }]);
        setNewModuleTitle("");
        setShowNewModule(false);
      }
    } finally { setSaving(false); }
  }

  async function createLesson(moduleId: string) {
    if (!newLesson.title.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch("/api/content/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          moduleId, title: newLesson.title.trim(), type: newLesson.type,
          videoUrl: newLesson.videoUrl || undefined, isFree: newLesson.isFree,
          sortOrder: modules.find((m) => m.id === moduleId)?.lessons.length ?? 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModules((prev) => prev.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, data.data], _count: { lessons: m._count.lessons + 1 } } : m
        ));
        setNewLesson({ title: "", type: "VIDEO", videoUrl: "", isFree: false });
        setShowNewLesson(null);
      }
    } finally { setSaving(false); }
  }

  async function saveModuleEdit(moduleId: string) {
    if (!editModuleForm.title.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/content/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editModuleForm.title.trim(), description: editModuleForm.description || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, title: editModuleForm.title.trim(), description: editModuleForm.description || null } : m));
        setEditingModuleId(null);
      }
    } finally { setSaving(false); }
  }

  async function saveLessonEdit(moduleId: string, lessonId: string) {
    if (!editLessonForm.title.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/content/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editLessonForm.title.trim(),
          type: editLessonForm.type,
          videoUrl: editLessonForm.videoUrl || undefined,
          isFree: editLessonForm.isFree,
          unlockAfterDays: editLessonForm.unlockAfterDays ? parseInt(editLessonForm.unlockAfterDays) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModules((prev) => prev.map((m) => m.id === moduleId ? {
          ...m,
          lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, title: editLessonForm.title.trim(), type: editLessonForm.type, isFree: editLessonForm.isFree } : l),
        } : m));
        setEditingLessonId(null);
      }
    } finally { setSaving(false); }
  }

  async function toggleModulePublish(moduleId: string, isPublished: boolean) {
    const token = localStorage.getItem("detailhub_access_token");
    await fetch(`/api/content/modules/${moduleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setModules((prev) => prev.map((m) => m.id === moduleId ? { ...m, isPublished: !isPublished } : m));
  }

  async function deleteModule(moduleId: string) {
    setConfirmState({
      open: true,
      title: "Excluir módulo?",
      description: "Este módulo e todas as suas aulas serão removidos permanentemente.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/content/modules/${moduleId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
      },
    });
  }

  async function deleteLesson(moduleId: string, lessonId: string) {
    setConfirmState({
      open: true,
      title: "Excluir aula?",
      description: "Esta aula será removida permanentemente.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        const token = localStorage.getItem("detailhub_access_token");
        await fetch(`/api/content/lessons/${lessonId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setModules((prev) => prev.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId), _count: { lessons: m._count.lessons - 1 } }
            : m
        ));
      },
    });
  }

  function formatDuration(secs: number | null) {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (communities.length === 0 && !isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteúdo</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie módulos e aulas das suas comunidades</p>
        </div>
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma comunidade encontrada</h3>
          <p className="text-gray-400 text-sm mb-6">Entre em contato com o administrador para criar uma comunidade.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteúdo</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie módulos e aulas das suas comunidades</p>
        </div>
        {communities.length > 1 && (
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="bg-white border border-gray-200 hover:border-violet-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          >
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Módulos", value: modules.length, color: "text-violet-400 bg-violet-500/10" },
          { label: "Aulas", value: modules.reduce((s, m) => s + m._count.lessons, 0), color: "text-purple-400 bg-purple-500/10" },
          { label: "Publicados", value: modules.filter((m) => m.isPublished).length, color: "text-green-400 bg-green-500/10" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5 text-center">
            <p className={`text-2xl font-bold ${color.split(" ")[0]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Modules */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <div key={module.id} className="glass-card overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => toggleModule(module.id)} className="text-gray-500 hover:text-gray-600 transition-colors">
                  {expandedModules.has(module.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <GripVertical className="w-4 h-4 text-gray-600" />
                {editingModuleId === module.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editModuleForm.title}
                      onChange={(e) => setEditModuleForm((p) => ({ ...p, title: e.target.value }))}
                      className={`${fieldClass()} py-1.5 text-sm`}
                      autoFocus
                    />
                    <button onClick={() => saveModuleEdit(module.id)} disabled={saving} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingModuleId(null)} className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{module.title}</p>
                    <p className="text-xs text-gray-500">{module._count.lessons} aula(s)</p>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${module.isPublished ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                    {module.isPublished ? "Publicado" : "Rascunho"}
                  </span>
                  {editingModuleId !== module.id && (
                    <button
                      onClick={() => { setEditingModuleId(module.id); setEditModuleForm({ title: module.title, description: module.description ?? "" }); }}
                      className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      title="Editar módulo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleModulePublish(module.id, module.isPublished)}
                    className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                    title={module.isPublished ? "Despublicar" : "Publicar"}
                  >
                    {module.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Excluir módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {expandedModules.has(module.id) && (
                <div className="border-t border-gray-200">
                  {module.lessons.map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type] ?? PlayCircle;
                    const isEditing = editingLessonId === lesson.id;
                    return (
                      <div key={lesson.id} className="border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors">
                          <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">{lesson.type}</span>
                              {lesson.videoDuration && <span className="text-xs text-gray-500">{formatDuration(lesson.videoDuration)}</span>}
                              {lesson.isFree && <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">Grátis</span>}
                              <span className="text-xs text-gray-600">{lesson.viewCount} views</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (isEditing) { setEditingLessonId(null); }
                              else { setEditingLessonId(lesson.id); setEditLessonForm({ title: lesson.title, type: lesson.type, videoUrl: "", isFree: lesson.isFree, unlockAfterDays: "" }); }
                            }}
                            className="p-1.5 text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                          >
                            {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteLesson(module.id, lesson.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="px-4 pb-4 pt-2 bg-white/[0.02] border-t border-gray-100 space-y-3">
                            <input
                              type="text"
                              value={editLessonForm.title}
                              onChange={(e) => setEditLessonForm((p) => ({ ...p, title: e.target.value }))}
                              placeholder="Título da aula"
                              className={fieldClass()}
                              autoFocus
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={editLessonForm.type}
                                onChange={(e) => setEditLessonForm((p) => ({ ...p, type: e.target.value }))}
                                className={fieldClass()}
                              >
                                {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <input
                                type="number"
                                value={editLessonForm.unlockAfterDays}
                                onChange={(e) => setEditLessonForm((p) => ({ ...p, unlockAfterDays: e.target.value }))}
                                placeholder="Liberar após (dias)"
                                min="0"
                                className={fieldClass()}
                              />
                            </div>
                            {editLessonForm.type === "VIDEO" && (
                              <input
                                type="url"
                                value={editLessonForm.videoUrl}
                                onChange={(e) => setEditLessonForm((p) => ({ ...p, videoUrl: e.target.value }))}
                                placeholder="URL do vídeo (YouTube, Vimeo...)"
                                className={fieldClass()}
                              />
                            )}
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editLessonForm.isFree}
                                onChange={(e) => setEditLessonForm((p) => ({ ...p, isFree: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-200 bg-white"
                              />
                              Aula gratuita (preview)
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveLessonEdit(module.id, lesson.id)}
                                disabled={saving || !editLessonForm.title.trim()}
                                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                              >
                                {saving ? "Salvando..." : "Salvar aula"}
                              </button>
                              <button onClick={() => setEditingLessonId(null)} className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add lesson */}
                  {showNewLesson === module.id ? (
                    <div className="p-4 bg-white/3 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Título da aula"
                          className={`${fieldClass()} sm:col-span-2`}
                          autoFocus
                        />
                        <select
                          value={newLesson.type}
                          onChange={(e) => setNewLesson((p) => ({ ...p, type: e.target.value }))}
                          className={fieldClass()}
                        >
                          {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {newLesson.type === "VIDEO" && (
                          <input
                            type="url"
                            value={newLesson.videoUrl}
                            onChange={(e) => setNewLesson((p) => ({ ...p, videoUrl: e.target.value }))}
                            placeholder="URL do vídeo (YouTube, Vimeo...)"
                            className={fieldClass()}
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newLesson.isFree}
                          onChange={(e) => setNewLesson((p) => ({ ...p, isFree: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-200 bg-white"
                        />
                        Aula gratuita (preview)
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => createLesson(module.id)}
                          disabled={saving || !newLesson.title.trim()}
                          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        >
                          {saving ? "Salvando..." : "Adicionar aula"}
                        </button>
                        <button onClick={() => setShowNewLesson(null)} className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowNewLesson(module.id);
                        setExpandedModules((p) => { const n = new Set(p); n.add(module.id); return n; });
                      }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar aula
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New module */}
          {showNewModule ? (
            <div className="glass-card p-5 space-y-3">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Nome do módulo"
                className={fieldClass()}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createModule()}
              />
              <div className="flex gap-2">
                <button onClick={createModule} disabled={saving || !newModuleTitle.trim()} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                  {saving ? "Criando..." : "Criar módulo"}
                </button>
                <button onClick={() => { setShowNewModule(false); setNewModuleTitle(""); }} className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-600 hover:text-gray-900 transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewModule(true)}
              className="flex items-center justify-center gap-2 w-full glass-card border-dashed p-4 text-sm text-gray-500 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Adicionar módulo
            </button>
          )}
        </div>
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
