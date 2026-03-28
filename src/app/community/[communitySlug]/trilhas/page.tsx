"use client";

// =============================================================================
// Trilhas page — Netflix-style horizontal scroll per COURSE space
// Route: /community/[communitySlug]/trilhas
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import ModuleCard from "@/components/content/ModuleCard";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";

interface Space {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  type: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
  memberCount?: number;
  shortDescription?: string | null;
}

interface Influencer {
  displayName?: string | null;
  user?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
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

interface ActiveTrailData {
  moduleId: string;
  moduleTitle: string;
  moduleSortOrder: number;
  spaceSlug: string;
  currentLessonId: string;
  currentLessonTitle: string;
  percentComplete: number;
  completedLessons: number;
  totalLessons: number;
}

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {[1, 2].map((i) => (
        <div key={i} className="mb-10">
          <div className="h-5 bg-white/10 rounded w-36 animate-pulse mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-3">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="w-52 flex-shrink-0 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-32 bg-white/10" />
                <div className="p-3 bg-[#0D0D0D] space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpaceRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-52 flex-shrink-0 rounded-xl overflow-hidden animate-pulse"
        >
          <div className="h-32 bg-white/10" />
          <div className="p-3 bg-[#0D0D0D] space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
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

  const [community, setCommunity] = useState<Community | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [spaces, setSpaces] = useState<SpaceWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optedIn, setOptedIn] = useState<boolean | null>(null);
  const [optInLoading, setOptInLoading] = useState(false);
  const [activeTrail, setActiveTrail] = useState<ActiveTrailData | null>(null);
  const [trailLoading, setTrailLoading] = useState(true);

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

        // Single call for community + spaces + influencer
        const overviewRes = await fetch(
          `/api/communities/${communitySlug}/overview`,
          { headers }
        );
        const overviewJson = overviewRes.ok ? await overviewRes.json() : { success: false };

        if (!overviewJson.success) {
          setError("Comunidade não encontrada.");
          setLoading(false);
          setTrailLoading(false);
          return;
        }

        const comm: Community = overviewJson.data.community;
        setCommunity(comm);
        if (overviewJson.data.influencer) setInfluencer(overviewJson.data.influencer);

        // Fetch opt-in status
        fetch(`/api/communities/${comm.id}/join`, { headers })
          .then((r) => r.json())
          .then((jd) => {
            if (jd.success) setOptedIn(jd.data?.joined ?? false);
          })
          .catch(() => {});

        // Fetch active trail
        fetch(`/api/communities/${communitySlug}/active-trail`, { headers })
          .then((r) => r.json())
          .then((td) => {
            if (td.success && td.data) setActiveTrail(td.data);
          })
          .catch(() => {})
          .finally(() => setTrailLoading(false));

        // Filter to COURSE spaces only
        const courseSpaces: Space[] = (overviewJson.data.spaces as Space[]).filter(
          (s) => s.type === "COURSE"
        );

        const withModules: SpaceWithModules[] = courseSpaces.map((s) => ({
          ...s,
          modules: [],
          modulesLoading: true,
        }));
        setSpaces(withModules);
        setLoading(false);

        // Load modules for each course space in parallel
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
        setTrailLoading(false);
      }
    }

    load();
  }, [communitySlug, router]);

  const handleOptIn = useCallback(async () => {
    if (!community) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    setOptInLoading(true);
    try {
      const method = optedIn ? "DELETE" : "POST";
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method,
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const d = await res.json();
      if (d.success) setOptedIn(d.data.joined);
    } catch {
      // ignore
    } finally {
      setOptInLoading(false);
    }
  }, [community, optedIn]);

  if (!loading && error) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#EEE6E4]">
      {/* Mobile top bar */}
      <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/8 flex items-center px-4 gap-3 sticky top-0 z-30 backdrop-blur-sm md:hidden">
        <Link href="/inicio" className="flex items-center gap-1.5 text-gray-400 hover:text-[#EEE6E4] transition-colors shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Início</span>
        </Link>
        <span className="text-sm font-semibold text-[#EEE6E4] truncate flex-1 min-w-0">
          {community?.name ?? "Comunidade"}
        </span>
        <NotificationBell />
      </header>

      {community && (
        <>
          <CommunityHeader
            community={community}
            influencer={influencer}
            optedIn={optedIn}
            onOptIn={handleOptIn}
            optInLoading={optInLoading}
          />
          <CommunityTabs
            communitySlug={communitySlug}
            primaryColor={community.primaryColor}
          />
        </>
      )}

      {loading ? (
        <PageSkeleton />
      ) : spaces.length === 0 ? (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma trilha disponível</p>
            <p className="text-gray-500 text-sm mt-1">
              A comunidade ainda não publicou trilhas de conteúdo.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Hero: Continue estudando */}
          {!trailLoading && activeTrail && (
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                Continue estudando
              </p>
              <Link
                href={`/community/${communitySlug}/trilhas/${activeTrail.moduleId}`}
                className="flex items-center gap-4 bg-[#111] border border-white/8 rounded-xl p-4 hover:border-[#006079]/40 transition-all group"
              >
                {/* Module number circle */}
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-black"
                  style={{
                    backgroundColor: `${community?.primaryColor ?? "#006079"}20`,
                    color: community?.primaryColor ?? "#009CD9",
                  }}
                >
                  {activeTrail.moduleSortOrder + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#EEE6E4] truncate">
                    {activeTrail.moduleTitle}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {activeTrail.currentLessonTitle}
                  </p>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
                    <div
                      className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all"
                      style={{ width: `${activeTrail.percentComplete}%` }}
                    />
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[#009CD9]">
                    {activeTrail.percentComplete}%
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {activeTrail.completedLessons}/{activeTrail.totalLessons} aulas
                  </p>
                </div>
              </Link>
            </div>
          )}

          {/* Trilhas sections — one horizontal scroll row per COURSE space */}
          {spaces.map((space) => (
            <section key={space.id} className="mb-10">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {space.icon && <span className="text-xl">{space.icon}</span>}
                  <h2 className="text-lg font-bold text-[#EEE6E4]">{space.name}</h2>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {space.modules.filter((m) => m.isPublished).length} módulos
                  </span>
                </div>
              </div>

              {/* Horizontal scroll */}
              {space.modulesLoading ? (
                <SpaceRowSkeleton />
              ) : space.modules.filter((m) => m.isPublished).length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-gray-500 text-sm">Nenhum módulo publicado ainda.</p>
                </div>
              ) : (
                <div
                  className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {space.modules
                    .filter((m) => m.isPublished)
                    .map((module) => (
                      <div key={module.id} style={{ scrollSnapAlign: "start" }}>
                        <ModuleCard
                          module={module}
                          communitySlug={communitySlug}
                          spaceSlug={space.slug}
                          primaryColor={community?.primaryColor}
                        />
                      </div>
                    ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
