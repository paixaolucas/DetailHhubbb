"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle, BookOpen, ArrowRight } from "lucide-react";
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
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80&auto=format&fit=crop",
  community: { name: "Detailing Pro", slug: "detailing-pro", primaryColor: "#009CD9" },
  totalLessons: 12,
  completedLessons: 4,
  percentComplete: 33,
  currentLesson: { id: "l5", title: "Clay bar e descontaminação química" },
};

export function HeroContinueWatching({ hasPlatform }: { hasPlatform: boolean | null }) {
  const [trail, setTrail] = useState<ActiveTrail | null | undefined>(undefined);
  const progressRef = useRef<HTMLDivElement>(null);

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

  // Anima a barra de progresso ao montar
  useEffect(() => {
    if (!trail || !progressRef.current) return;
    const el = progressRef.current;
    el.style.width = "0%";
    const timer = setTimeout(() => {
      el.style.width = `${trail.percentComplete}%`;
    }, 200);
    return () => clearTimeout(timer);
  }, [trail]);

  // Loading skeleton
  if (trail === undefined) {
    return (
      <div className="relative overflow-hidden rounded-2xl h-[200px] sm:h-[260px] lg:h-[300px] bg-white/5 animate-pulse" />
    );
  }

  // Sem assinatura
  if (hasPlatform === false) {
    return (
      <div className="relative overflow-hidden rounded-2xl h-[180px] sm:h-[220px] bg-gradient-to-br from-[#0D1F26] via-[#061A22] to-[#0D0D0D] flex items-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #006079 0%, transparent 60%), radial-gradient(circle at 80% 20%, #009CD9 0%, transparent 50%)",
          }}
        />
        <div className="relative px-8 space-y-3 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#009CD9]">
            Detailer&apos;HUB
          </p>
          <p className="text-xl sm:text-2xl font-black text-[#EEE6E4] leading-tight">
            Acesse todas as trilhas e comunidades
          </p>
          <Link
            href="/dashboard/assinar"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#006079] to-[#009CD9] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Assinar plataforma <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Sem trilha em andamento
  if (!trail) {
    return (
      <div className="relative overflow-hidden rounded-2xl h-[180px] sm:h-[220px] bg-gradient-to-br from-[#0A1A20] to-[#111] border border-white/5 flex items-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #009CD9 0%, transparent 60%)",
          }}
        />
        <div className="relative px-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#009CD9]">
            Trilhas de conteúdo
          </p>
          <p className="text-xl sm:text-2xl font-black text-[#EEE6E4] leading-tight">
            Comece sua primeira trilha
          </p>
          <p className="text-sm text-gray-400">
            Acesse os cursos e módulos das suas comunidades.
          </p>
          <Link
            href="/dashboard/meu-aprendizado"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#009CD9] bg-[#006079]/20 hover:bg-[#006079]/30 border border-[#009CD9]/20 px-4 py-2.5 rounded-xl transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Ver trilhas disponíveis
          </Link>
        </div>
      </div>
    );
  }

  const href = `/community/${trail.community.slug}/trilhas`;

  return (
    <div className="relative overflow-hidden rounded-2xl h-[200px] sm:h-[260px] lg:h-[300px] group">
      {/* Background image */}
      {trail.coverImageUrl ? (
        <Image
          src={trail.coverImageUrl}
          alt={trail.title}
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `${trail.community.primaryColor}30` }}
        />
      )}

      {/* Gradient overlay — forte na esquerda/baixo para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
        <div className="max-w-xl space-y-3">
          {/* Chip */}
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: trail.community.primaryColor }}
          >
            Continuar assistindo · {trail.community.name}
          </p>

          {/* Título da trilha */}
          <h3 className="text-lg sm:text-2xl font-black text-white leading-tight line-clamp-2">
            {trail.title}
          </h3>

          {/* Aula atual */}
          <p className="text-sm text-gray-300 line-clamp-1">
            {trail.currentLesson.title}
          </p>

          {/* Progress + CTA */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[120px] max-w-[220px]">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  ref={progressRef}
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    backgroundColor: trail.community.primaryColor,
                    width: "0%",
                  }}
                />
              </div>
              <span className="text-xs text-gray-300 tabular-nums flex-shrink-0">
                {trail.percentComplete}%
              </span>
            </div>

            <Link
              href={href}
              className="flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#009CD9] hover:text-white transition-all duration-200 flex-shrink-0"
            >
              <PlayCircle className="w-4 h-4" />
              Continuar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
