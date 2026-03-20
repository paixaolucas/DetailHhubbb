"use client";

// =============================================================================
// Lesson viewer page — 2-column layout with sidebar lesson list + video
// Route: /community/[communitySlug]/trilhas/[moduleId]/[lessonId]
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import VideoEmbed from "@/components/ui/VideoEmbed";
import { STORAGE_KEYS } from "@/lib/constants";

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  videoUrl?: string | null;
  videoDuration?: number | null;
  content?: string | null;
  isCompleted?: boolean;
  isFree?: boolean;
  isPublished?: boolean;
  sortOrder: number;
}

interface Module {
  id: string;
  title: string;
  communityId: string;
  spaceId?: string | null;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

  const [communityId, setCommunityId] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/trilhas/${moduleId}/${lessonId}`);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const commRes = await fetch("/api/communities?published=true", { headers });
        const commJson = await commRes.json();
        const comm = (commJson.communities as { id: string; slug: string }[])?.find(
          (c) => c.slug === communitySlug
        );
        if (!comm) { setError("Comunidade não encontrada."); setLoading(false); return; }
        setCommunityId(comm.id);

        const spacesRes = await fetch(`/api/communities/${comm.id}/spaces`, { headers });
        const spacesJson = await spacesRes.json();
        const courseSpaces = (spacesJson.data ?? []).filter((s: { type: string }) => s.type === "COURSE");

        let foundModule: Module | null = null;
        let foundLessons: Lesson[] = [];
        let foundSpaceId: string | null = null;

        for (const space of courseSpaces) {
          const modRes = await fetch(
            `/api/communities/${comm.id}/spaces/${space.id}/modules`,
            { headers }
          );
          const modJson = await modRes.json();
          const mods: Module[] = modJson.success ? modJson.data : [];
          const mod = mods.find((m) => m.id === moduleId);
          if (mod) {
            foundModule = mod;
            foundSpaceId = space.id;
            const lessRes = await fetch(
              `/api/communities/${comm.id}/spaces/${space.id}/modules/${moduleId}/lessons`,
              { headers }
            );
            const lessJson = await lessRes.json();
            foundLessons = lessJson.success ? lessJson.data : [];
            break;
          }
        }

        if (!foundModule) { setError("Módulo não encontrado."); setLoading(false); return; }

        setModule(foundModule);
        setSpaceId(foundSpaceId);
        setLessons(foundLessons);

        const current = foundLessons.find((l) => l.id === lessonId) ?? foundLessons[0] ?? null;
        setCurrentLesson(current);

        const completed = new Set(
          foundLessons.filter((l) => l.isCompleted).map((l) => l.id)
        );
        setCompletedIds(completed);

        setLoading(false);
      } catch {
        setError("Erro de conexão.");
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, moduleId, lessonId, router]);

  const handleMarkComplete = useCallback(async () => {
    if (!currentLesson || !communityId || !spaceId) return;
    setCompleting(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(
        `/api/communities/${communityId}/spaces/${spaceId}/modules/${moduleId}/lessons/${currentLesson.id}/progress`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        }
      );
      const json = await res.json();
      if (json.success) {
        setCompletedIds((prev) => { const next = new Set(prev); next.add(currentLesson.id); return next; });
        setCurrentLesson((l) => l ? { ...l, isCompleted: true } : l);
      }
    } catch {
      // silent
    } finally {
      setCompleting(false);
    }
  }, [currentLesson, communityId, spaceId, moduleId]);

  const isCompleted = currentLesson ? completedIds.has(currentLesson.id) : false;
  const publishedLessons = lessons.filter((l) => l.isPublished);

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
          <Link href={`/community/${communitySlug}/trilhas`} className="text-xs text-gray-400 mt-3 inline-block hover:text-[#EEE6E4] transition-colors">
            ← Voltar às trilhas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#EEE6E4]">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/community/${communitySlug}/trilhas/${moduleId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#009CD9]" />
          <span className="text-sm font-medium text-[#EEE6E4] truncate">{module?.title ?? ""}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#009CD9] animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
          {/* Sidebar — lesson list */}
          <aside className="lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#181818]">
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                Aulas ({publishedLessons.length})
              </p>
              <div className="space-y-1">
                {publishedLessons.map((lesson) => {
                  const done = completedIds.has(lesson.id);
                  const isCurrent = lesson.id === currentLesson?.id;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/community/${communitySlug}/trilhas/${moduleId}/${lesson.id}`}
                      onClick={() => setCurrentLesson(lesson)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                        isCurrent
                          ? "bg-[#006079]/20 border border-[#006079]/30 text-[#EEE6E4]"
                          : "text-gray-400 hover:bg-white/5 hover:text-[#EEE6E4]"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1">{lesson.title}</span>
                      {lesson.videoDuration != null && (
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {formatDuration(lesson.videoDuration)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-8">
            {!currentLesson ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-sm">Selecione uma aula para começar.</p>
              </div>
            ) : (
              <div className="max-w-3xl">
                <h1 className="text-xl font-bold text-[#EEE6E4] mb-4">{currentLesson.title}</h1>

                {/* Video */}
                {currentLesson.videoUrl && (
                  <VideoEmbed
                    url={currentLesson.videoUrl}
                    title={currentLesson.title}
                    className="mb-6"
                  />
                )}

                {/* Description / Content */}
                {currentLesson.description && (
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {currentLesson.description}
                  </p>
                )}
                {currentLesson.content && (
                  <div className="prose prose-invert prose-sm max-w-none mb-6 text-gray-300">
                    {currentLesson.content}
                  </div>
                )}

                {/* Mark complete button */}
                <div className="pt-4 border-t border-white/10">
                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-[#009CD9]">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Aula concluída!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={completing}
                      className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                    >
                      {completing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar como concluída
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
