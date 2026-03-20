"use client";

// =============================================================================
// Module detail page — lists lessons in a module
// Route: /community/[communitySlug]/trilhas/[moduleId]
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import LessonCard from "@/components/content/LessonCard";
import { STORAGE_KEYS } from "@/lib/constants";

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoDuration?: number | null;
  isCompleted?: boolean;
  isFree?: boolean;
  isPublished?: boolean;
  isLocked?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isPublished: boolean;
  communityId: string;
  spaceId?: string | null;
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 bg-white/10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-white/10 rounded w-2/3" />
            <div className="h-3 bg-white/10 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/trilhas/${moduleId}`);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        // Find community
        const commRes = await fetch("/api/communities?published=true", { headers });
        const commJson = await commRes.json();
        if (!commJson.success) throw new Error("Erro");

        const comm = (commJson.communities as { id: string; slug: string }[]).find(
          (c) => c.slug === communitySlug
        );
        if (!comm) { setError("Comunidade não encontrada."); setLoading(false); return; }

        // Get spaces to find the spaceId
        const spacesRes = await fetch(`/api/communities/${comm.id}/spaces`, { headers });
        const spacesJson = await spacesRes.json();
        const courseSpaces = (spacesJson.data ?? []).filter((s: { type: string }) => s.type === "COURSE");

        // Find module in any course space
        let foundModule: Module | null = null;
        let foundLessons: Lesson[] = [];

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
            const lessRes = await fetch(
              `/api/communities/${comm.id}/spaces/${space.id}/modules/${moduleId}/lessons`,
              { headers }
            );
            const lessJson = await lessRes.json();
            foundLessons = lessJson.success ? lessJson.data : [];
            break;
          }
        }

        if (!foundModule) {
          setError("Módulo não encontrado.");
          setLoading(false);
          return;
        }

        setModule(foundModule);
        setLessons(foundLessons);
        setLoading(false);
      } catch {
        setError("Erro de conexão.");
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, moduleId, router]);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/community/${communitySlug}/trilhas`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#EEE6E4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Trilhas
        </Link>

        {loading ? (
          <>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
              <div className="h-1.5 bg-white/10 rounded-full" />
            </div>
            <Skeleton />
          </>
        ) : (
          <>
            {/* Module info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#006079]/20 border border-[#006079]/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#009CD9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-[#EEE6E4] mb-1">{module?.title}</h1>
                  {module?.description && (
                    <p className="text-sm text-gray-400 mb-4">{module.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{lessons.length} {lessons.length === 1 ? "aula" : "aulas"}</span>
                    <span>{completedCount}/{lessons.length} concluídas</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons list */}
            {lessons.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
                <p className="text-gray-400 text-sm">Nenhuma aula publicada ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons
                  .filter((l) => l.isPublished)
                  .map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      href={`/community/${communitySlug}/trilhas/${moduleId}/${lesson.id}`}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
