"use client";

import { Calendar, Users, User, CheckCircle2 } from "lucide-react";

interface EventHost {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface EventSession {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string | Date;
  host: EventHost;
  rsvpCount: number;
  status: string;
}

interface EventCardProps {
  session: EventSession;
  userRsvp?: string | null;
  onRsvp: (status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot?: boolean }> = {
  SCHEDULED: {
    label: "Agendada",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  LIVE: {
    label: "Ao Vivo",
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: true,
  },
  ENDED: {
    label: "Encerrada",
    classes: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
  CANCELED: {
    label: "Cancelada",
    classes: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
};

const RSVP_OPTIONS: { value: string; label: string; active: string; inactive: string }[] = [
  {
    value: "GOING",
    label: "Vou",
    active: "bg-green-600/40 border-green-500/60 text-green-300",
    inactive: "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20",
  },
  {
    value: "MAYBE",
    label: "Talvez",
    active: "bg-yellow-600/30 border-yellow-500/50 text-yellow-300",
    inactive: "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20",
  },
  {
    value: "NOT_GOING",
    label: "Não vou",
    active: "bg-red-600/30 border-red-500/50 text-red-300",
    inactive: "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20",
  },
];

function formatEventDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventCard({ session, userRsvp, onRsvp }: EventCardProps) {
  const statusConf =
    STATUS_CONFIG[session.status] ?? STATUS_CONFIG["SCHEDULED"];
  const isLive = session.status === "LIVE";
  const hostName = `${session.host.firstName} ${session.host.lastName}`;
  const isPast = session.status === "ENDED" || session.status === "CANCELED";

  return (
    <div
      className={`bg-white/5 border rounded-2xl p-4 transition-all ${
        isLive ? "border-red-500/30" : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Status + Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${statusConf.classes}`}
            >
              {statusConf.dot && (
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              )}
              {statusConf.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">
            {session.title}
          </h3>
          {session.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {formatEventDate(session.scheduledAt)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <User className="w-3.5 h-3.5" />
          {hostName}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          {session.rsvpCount}
        </span>
      </div>

      {/* RSVP buttons — only show for future / live sessions */}
      {!isPast && (
        <div className="flex gap-2 border-t border-white/10 pt-3">
          {RSVP_OPTIONS.map((opt) => {
            const isActive = userRsvp === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onRsvp(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-xl border transition-all ${
                  isActive ? opt.active : opt.inactive
                }`}
              >
                {isActive && <CheckCircle2 className="w-3 h-3" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
