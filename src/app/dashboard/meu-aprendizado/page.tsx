"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, PlayCircle, CheckCircle2, Clock, FileText,
  Headphones, Award, Star, ChevronDown, ChevronRight,
} from "lucide-react";

const LESSON_TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: PlayCircle, AUDIO: Headphones, TEXT: FileText,
  PDF: FileText, QUIZ: Star, ASSIGNMENT: Award, LIVE_REPLAY: PlayCircle,
};

interface LessonData {
  id: string; title: string; type: string;
  duration: string | null; completed: boolean;
  progressSecs: number; isFree: boolean;
}

interface ModuleData {
  id: string; title: string; progress: number; lessons: LessonData[];
}

interface CommunityData {
  communityId: string; communityName: string;
  communitySlug?: string;
  communityColor: string; communityLogoUrl: string | null;
  totalLessons: number; completedLessons: number;
  progress: number; modules: ModuleData[];
}

interface Stats {
  totalCommunities: number; completedLessons: number;
  totalLessons: number; hoursWatched: number;
}

function LessonRow({ lesson, communitySlug }: { lesson: LessonData; communitySlug?: string }) {
  const router = useRouter();
  const Icon = LESSON_TYPE_ICONS[lesson.type] ?? PlayCircle;
  const isCurrent = !lesson.completed && lesson.progressSecs > 0;

  function handleClick() {
    if (communitySlug) {
      router.push(`/community/${communitySlug}/feed`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        isCurrent ? "bg-[#007A99]/10 border border-[#007A99]/20" : "hover:bg-[#E6F4F7]"
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        lesson.completed ? "bg-green-500/20" : isCurrent ? "bg-[#007A99]/20" : "bg-white"
      }`}>
        {lesson.completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-[#009CD9]" : "text-gray-500"}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          lesson.completed ? "text-gray-500 line-through" : isCurrent ? "text-[#EEE6E4]" : "text-gray-400"
        }`}>
          {lesson.title}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {lesson.duration && (
          <span className="text-xs text-gray-500 hidden sm:block">{lesson.duration}</span>
        )}
        {isCurrent && (
          <span className="text-xs bg-[#006079] text-white px-2 py-0.5 rounded-full font-medium">
            Continuar
          </span>
        )}
        {!lesson.completed && !isCurrent && (
          <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full">
            Iniciar
          </span>
        )}
      </div>
    </div>
  );
}

function ModuleAccordion({ module, communitySlug }: { module: ModuleData; communitySlug?: string }) {
  const [open, setOpen] = useState(module.progress > 0 && module.progress < 100);
  const completedCount = module.lessons.filter((l) => l.completed).length;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 p-4 w-full hover:bg-[#E6F4F7] transition-colors text-left"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          module.progress === 100 ? "bg-green-500/20" : "bg-white"
        }`}>
          {module.progress === 100 ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <BookOpen className="w-4 h-4 text-[#009CD9]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#EEE6E4]">{module.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {completedCount}/{module.lessons.length} aulas concluídas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-400">{module.progress}%</span>
          {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 p-2 space-y-1">
          {module.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} communitySlug={communitySlug} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MeuAprendizadoPage() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCommunities: 0, completedLessons: 0, totalLessons: 0, hoursWatched: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("detailhub_access_token");
    if (!token) return;
    fetch("/api/users/me/learning", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCommunities(d.data.communities ?? []);
          setStats(d.data.stats ?? {});
        } else { setError(d.error ?? "Erro ao carregar dados"); }
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Meu Aprendizado</h1>
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#EEE6E4]">Meu Aprendizado</h1>
        <p className="text-gray-400 text-sm mt-1">Continue seus cursos e acompanhe seu progresso</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Aulas concluídas", value: stats.completedLessons, icon: CheckCircle2, color: "text-green-400 bg-green-500/10" },
          { label: "Horas estudadas", value: `${stats.hoursWatched}h`, icon: Clock, color: "text-[#009CD9] bg-[#007A99]/10" },
          { label: "Comunidades", value: stats.totalCommunities, icon: BookOpen, color: "text-[#009CD9] bg-[#007A99]/10" },
          { label: "Total de aulas", value: stats.totalLessons, icon: Award, color: "text-yellow-400 bg-yellow-500/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
              <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
            </div>
            <p className="text-xl font-bold text-[#EEE6E4]">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {communities.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 bg-[#007A99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-[#009CD9]" />
          </div>
          <h3 className="text-xl font-semibold text-[#EEE6E4] mb-2">Nenhuma comunidade ainda</h3>
          <p className="text-gray-400 text-sm mb-6">Você ainda não está inscrito em nenhuma comunidade.</p>
          <a href="/communities" className="bg-[#006079] hover:bg-[#007A99] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all inline-block">
            Explorar comunidades
          </a>
        </div>
      ) : (
        communities.map((community) => (
          <div key={community.communityId} className="glass-card overflow-hidden">
            {/* Community header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[#EEE6E4] font-bold text-sm"
                    style={{ backgroundColor: community.communityColor }}
                  >
                    {community.communityName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#EEE6E4]">{community.communityName}</h2>
                    <p className="text-xs text-gray-500">
                      {community.completedLessons} de {community.totalLessons} aulas concluídas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#EEE6E4]">{community.progress}%</p>
                    <p className="text-xs text-gray-500">completo</p>
                  </div>
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={community.communityColor} strokeWidth="3"
                        strokeDasharray={`${community.progress} ${100 - community.progress}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${community.progress}%`, backgroundColor: community.communityColor }}
                />
              </div>
            </div>

            {/* Modules */}
            {community.modules.length > 0 ? (
              <div className="p-4 space-y-3">
                {community.modules.map((module) => <ModuleAccordion key={module.id} module={module} communitySlug={community.communitySlug} />)}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">Nenhum módulo publicado ainda.</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
