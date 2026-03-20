"use client";

// =============================================================================
// Trilhas page — lists all COURSE spaces and their modules
// Route: /community/[communitySlug]/trilhas
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, AlertCircle } from "lucide-react";
import ModuleCard from "@/components/content/ModuleCard";
import { STORAGE_KEYS } from "@/lib/constants";

interface Space {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  type: string;
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isPublished: boolean;
  isLocked?: boolean;
  _count: { lessons: number };
  progressPercent?: number;
}

interface SpaceWithModules extends Space {
  modules: Module[];
  modulesLoading: boolean;
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
              <div className="h-1.5 bg-white/10 rounded-full mt-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrilhasPage() {
  const params = useParams();
  const router = useRouter();
  const communitySlug = params.communitySlug as string;

  const [communityId, setCommunityId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<SpaceWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (!token) {
          router.push(`/login?redirect=/community/${communitySlug}/trilhas`);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        // Find community
        const commRes = await fetch("/api/communities?published=true", { headers });
        const commJson = await commRes.json();
        if (!commJson.success) throw new Error("Erro ao carregar comunidade");

        const comm = (commJson.communities as { id: string; slug: string }[]).find(
          (c) => c.slug === communitySlug
        );
        if (!comm) {
          setError("Comunidade não encontrada.");
          setLoading(false);
          return;
        }
        setCommunityId(comm.id);

        // Get all spaces
        const spacesRes = await fetch(`/api/communities/${comm.id}/spaces`, { headers });
        const spacesJson = await spacesRes.json();
        if (!spacesJson.success) throw new Error("Erro ao carregar trilhas");

        const courseSpaces: Space[] = (spacesJson.data as Space[]).filter(
          (s) => s.type === "COURSE"
        );

        const withModules: SpaceWithModules[] = courseSpaces.map((s) => ({
          ...s,
          modules: [],
          modulesLoading: true,
        }));
        setSpaces(withModules);
        setLoading(false);

        // Load modules for each course space
        await Promise.all(
          courseSpaces.map(async (space) => {
            try {
              const res = await fetch(
                `/api/communities/${comm.id}/spaces/${space.id}/modules`,
                { headers }
              );
              const json = await res.json();
              setSpaces((prev) =>
                prev.map((s) =>
                  s.id === space.id
                    ? { ...s, modules: json.success ? json.data : [], modulesLoading: false }
                    : s
                )
              );
            } catch {
              setSpaces((prev) =>
                prev.map((s) =>
                  s.id === space.id ? { ...s, modulesLoading: false } : s
                )
              );
            }
          })
        );
      } catch {
        setError("Erro de conexão. Tente novamente.");
        setLoading(false);
      }
    }

    load();
  }, [communitySlug, router]);

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#EEE6E4]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#006079]/20 border border-[#006079]/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#009CD9]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#EEE6E4]">Trilhas</h1>
            <p className="text-sm text-gray-400">Aprenda no seu ritmo</p>
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : spaces.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma trilha disponível</p>
            <p className="text-gray-500 text-sm mt-1">
              A comunidade ainda não publicou trilhas de conteúdo.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {spaces.map((space) => (
              <section key={space.id}>
                {/* Space header */}
                <div className="flex items-center gap-2 mb-4">
                  {space.icon && <span className="text-lg">{space.icon}</span>}
                  <h2 className="text-base font-semibold text-[#EEE6E4]">{space.name}</h2>
                </div>

                {space.modulesLoading ? (
                  <Skeleton />
                ) : space.modules.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-sm">Nenhum módulo publicado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {space.modules
                      .filter((m) => m.isPublished)
                      .map((module) => (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          communitySlug={communitySlug}
                          spaceSlug={space.slug}
                        />
                      ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
