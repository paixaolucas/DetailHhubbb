"use client";

// =============================================================================
// LessonCard — single lesson row with type icon, duration, free badge, completion
// =============================================================================

import Link from "next/link";
import { PlayCircle, FileText, Lock, CheckCircle2, Clock } from "lucide-react";

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    type: string;
    videoDuration?: number | null;
    isCompleted?: boolean;
    isFree?: boolean;
    isLocked?: boolean;
    isPublished?: boolean;
  };
  href: string;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "VIDEO":
      return <PlayCircle className="w-4 h-4 text-[#009CD9]" />;
    case "TEXT":
    case "ARTICLE":
      return <FileText className="w-4 h-4 text-amber-400" />;
    default:
      return <PlayCircle className="w-4 h-4 text-gray-500" />;
  }
}

export default function LessonCard({ lesson, href }: LessonCardProps) {
  const isLocked = lesson.isLocked ?? false;
  const isCompleted = lesson.isCompleted ?? false;

  return (
    <Link
      href={isLocked ? "#" : href}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
        isLocked
          ? "border-white/5 opacity-50 cursor-not-allowed"
          : isCompleted
          ? "border-[#006079]/30 bg-[#006079]/5 hover:bg-[#006079]/10"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#006079]/30"
      }`}
    >
      {/* Completion indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-[#009CD9]" />
        ) : isLocked ? (
          <Lock className="w-4 h-4 text-gray-500" />
        ) : (
          <TypeIcon type={lesson.type} />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug truncate ${isCompleted ? "text-[#009CD9]" : "text-[#EEE6E4]"}`}>
          {lesson.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {lesson.videoDuration != null && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDuration(lesson.videoDuration)}
            </span>
          )}
          {lesson.isFree && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
              Grátis
            </span>
          )}
          {!lesson.isPublished && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Rascunho
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
