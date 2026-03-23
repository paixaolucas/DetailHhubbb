"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface ActiveTrail {
  id: string;
  title: string;
  coverImageUrl: string | null;
  community: { name: string; slug: string; primaryColor: string };
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  currentLesson: { id: string; title: string };
}

const DEV_FALLBACK_TRAIL: ActiveTrail = {
  id: "mock-trail-1",
  title: "Detailing Profissional — Nível 1",
  coverImageUrl:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80&auto=format&fit=crop",
  community: { name: "Detailing Pro", slug: "detailing-pro", primaryColor: "#009CD9" },
  totalLessons: 12,
  completedLessons: 4,
  percentComplete: 33,
  currentLesson: { id: "l5", title: "Clay bar e descontaminação química" },
};

export function TrackInProgress() {
  const [trail, setTrail] = useState<ActiveTrail | null | undefined>(undefined);

  useEffect(() => {
    apiClient<ActiveTrail | null>("/api/dashboard/active-trail")
      .then((d) => {
        const resolved = d.success ? (d.data ?? null) : null;
        if (!resolved && process.env.NODE_ENV === "development") {
          setTrail(DEV_FALLBACK_TRAIL);
        } else {
          setTrail(resolved);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") {
          setTrail(DEV_FALLBACK_TRAIL);
        } else {
          setTrail(null);
        }
      });
  }, []);

  if (trail === undefined) {
    return (
      <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col sm:flex-row animate-pulse">
        <div className="w-full sm:w-36 h-32 sm:h-auto flex-shrink-0 bg-white/10" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 bg-white/10 rounded w-20" />
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-1.5 bg-white/10 rounded-full mt-4" />
        </div>
      </div>
    );
  }

  if (!trail) return null;

  const href = `/community/${trail.community.slug}/content/${trail.id}`;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col sm:flex-row items-stretch h-full">
      {/* Cover thumbnail */}
      {trail.coverImageUrl ? (
        <div className="relative w-full sm:w-40 h-36 sm:h-auto flex-shrink-0">
          <Image
            src={trail.coverImageUrl}
            alt={trail.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 hidden sm:block" />
          {/* Play overlay on mobile */}
          <div className="absolute inset-0 flex items-center justify-center sm:hidden bg-black/30">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="w-full sm:w-40 h-36 sm:h-auto flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: `${trail.community.primaryColor}20` }}
        >
          <PlayCircle className="w-10 h-10 opacity-30" style={{ color: trail.community.primaryColor }} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Continuar assistindo
            </p>
          </div>
          <p className="text-sm font-bold text-[#EEE6E4] leading-tight line-clamp-2">{trail.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1">
            <span className="font-medium" style={{ color: trail.community.primaryColor }}>
              {trail.community.name}
            </span>
            {" · "}
            {trail.currentLesson.title}
          </p>
        </div>

        {/* Progress bar + CTA */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-500 tabular-nums">
              <span>{trail.percentComplete}% concluído</span>
              <span>{trail.completedLessons}/{trail.totalLessons} aulas</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#006079] to-[#009CD9] transition-all duration-700"
                style={{ width: `${trail.percentComplete}%` }}
              />
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#006079]/40 hover:bg-[#006079]/60 border border-[#009CD9]/20 px-3 py-2 rounded-xl transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-[#009CD9]" />
            Continuar de onde parei
          </Link>
        </div>
      </div>
    </div>
  );
}
