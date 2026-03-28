"use client";

// =============================================================================
// ModuleCard — Netflix-style vertical card for horizontal scroll rows
// =============================================================================

import Link from "next/link";
import { Lock, CheckCircle } from "lucide-react";

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description?: string | null;
    sortOrder: number;
    isLocked?: boolean;
    isPublished: boolean;
    _count: { lessons: number };
    progressPercent?: number;
  };
  communitySlug: string;
  spaceSlug: string;
  primaryColor?: string;
}

export default function ModuleCard({
  module,
  communitySlug,
  primaryColor,
}: ModuleCardProps) {
  const href = `/community/${communitySlug}/trilhas/${module.id}`;
  const isLocked = module.isLocked ?? false;
  const pct = module.progressPercent ?? 0;
  const lessonCount = module._count.lessons;
  const color = primaryColor ?? "#006079";
  const accentColor = primaryColor ?? "#009CD9";

  const isCompleted = pct === 100;
  const isInProgress = pct > 0 && pct < 100;

  return (
    <Link
      href={isLocked ? "#" : href}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
      className={`block w-52 flex-shrink-0 rounded-xl overflow-hidden border border-white/8 bg-[#0D0D0D] ${
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-white/20 hover:scale-[1.02] transition-all cursor-pointer"
      }`}
    >
      {/* Gradient area */}
      <div className="relative h-32 overflow-hidden">
        {isLocked ? (
          <div className="w-full h-full bg-[#111] flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
            }}
          >
            {/* Module number */}
            <span
              className="text-4xl font-black select-none"
              style={{ color: `${accentColor}60` }}
            >
              {module.sortOrder + 1}
            </span>

            {/* Completed overlay */}
            {isCompleted && (
              <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400 opacity-80" />
              </div>
            )}
          </div>
        )}

        {/* Draft badge */}
        {!module.isPublished && (
          <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 bg-amber-500/80 text-white rounded font-semibold">
            Rascunho
          </span>
        )}

        {/* In-progress dot */}
        {isInProgress && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        )}
      </div>

      {/* Content area */}
      <div className="p-3 bg-[#0D0D0D]">
        <p className="font-semibold text-[#EEE6E4] text-sm leading-snug line-clamp-2 mb-1">
          {module.title}
        </p>
        <p className="text-[10px] text-gray-500">
          {lessonCount} {lessonCount === 1 ? "aula" : "aulas"}
        </p>

        {/* Progress state */}
        {isInProgress && (
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(to right, ${color}, ${accentColor})`,
              }}
            />
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-400">Concluído</span>
          </div>
        )}
      </div>
    </Link>
  );
}
