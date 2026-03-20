"use client";

// =============================================================================
// ModuleCard — displays a content module with progress bar
// =============================================================================

import Link from "next/link";
import { BookOpen, Lock, ChevronRight } from "lucide-react";

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
}

export default function ModuleCard({ module, communitySlug, spaceSlug }: ModuleCardProps) {
  const href = `/community/${communitySlug}/trilhas/${module.id}`;
  const isLocked = module.isLocked ?? false;
  const pct = module.progressPercent ?? 0;
  const lessonCount = module._count.lessons;

  return (
    <Link
      href={isLocked ? "#" : href}
      className={`block bg-white/5 border border-white/10 rounded-xl p-5 transition-all group ${
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-white/10 hover:border-[#006079]/30"
      }`}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
    >
      <div className="flex items-start gap-4">
        {/* Module number */}
        <div className="w-10 h-10 rounded-xl bg-[#006079]/20 border border-[#006079]/30 flex items-center justify-center flex-shrink-0">
          {isLocked ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : (
            <span className="text-sm font-bold text-[#009CD9]">{module.sortOrder + 1}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#EEE6E4] text-sm leading-snug truncate">
              {module.title}
            </h3>
            {!module.isPublished && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                Rascunho
              </span>
            )}
          </div>

          {module.description && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
              {module.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <BookOpen className="w-3.5 h-3.5" />
              {lessonCount} {lessonCount === 1 ? "aula" : "aulas"}
            </div>

            {pct > 0 && (
              <span className="text-xs text-[#009CD9]">{pct}% concluído</span>
            )}
          </div>

          {/* Progress bar */}
          {lessonCount > 0 && (
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* Arrow */}
        {!isLocked && (
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#009CD9] flex-shrink-0 mt-1 transition-colors" />
        )}
      </div>
    </Link>
  );
}
