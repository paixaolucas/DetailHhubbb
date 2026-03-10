"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
// ─── Inline time-ago (no date-fns required) ───────────────────────────────────
// (date-fns is not in this project's dependencies)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  actor?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "agora mesmo";
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "ontem";
    if (days < 7) return `há ${days} dias`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `há ${weeks} semana${weeks > 1 ? "s" : ""}`;
    const months = Math.floor(days / 30);
    return `há ${months} mês${months > 1 ? "es" : ""}`;
  } catch {
    return "";
  }
}

function ActorAvatar({
  actor,
}: {
  actor?: NotificationItem["actor"];
}) {
  if (!actor) {
    return (
      <div className="w-8 h-8 bg-violet-600/20 border border-violet-500/30 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell className="w-3.5 h-3.5 text-violet-400" />
      </div>
    );
  }

  const initials =
    `${actor.firstName?.[0] ?? ""}${actor.lastName?.[0] ?? ""}`.toUpperCase();

  if (actor.avatarUrl) {
    return (
      <img
        src={actor.avatarUrl}
        alt={`${actor.firstName} ${actor.lastName}`}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials || "?"}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationDropdown({
  notifications,
  onRead,
  onReadAll,
}: NotificationDropdownProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleClick(notification: NotificationItem) {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[#F0EEFF] border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-gray-900 font-semibold text-sm">Notificações</span>
        {unreadCount > 0 && (
          <button
            onClick={onReadAll}
            className="text-violet-400 text-xs hover:text-violet-300 transition-colors font-medium"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell className="w-8 h-8 text-gray-600" />
            <p className="text-gray-500 text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-violet-50 transition-colors relative ${
                !notification.isRead ? "bg-violet-500/5" : ""
              }`}
            >
              {/* Unread indicator */}
              {!notification.isRead && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-violet-500 rounded-full" />
              )}

              <ActorAvatar actor={notification.actor} />

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug truncate ${
                    notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                  }`}
                >
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 text-left">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2.5">
          <a
            href="/dashboard/notifications"
            className="text-violet-400 text-xs hover:text-violet-300 transition-colors font-medium"
          >
            Ver todas as notificações
          </a>
        </div>
      )}
    </div>
  );
}
