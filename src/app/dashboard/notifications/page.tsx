"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2, CheckCheck } from "lucide-react";
// date-fns is not in this project — using inline helpers below

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
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

type GroupKey = "Hoje" | "Ontem" | "Esta semana" | "Anteriores";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Inline date helpers ──────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupNotifications(
  items: NotificationItem[]
): Record<GroupKey, NotificationItem[]> {
  const groups: Record<GroupKey, NotificationItem[]> = {
    "Hoje": [],
    "Ontem": [],
    "Esta semana": [],
    "Anteriores": [],
  };

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const item of items) {
    const date = new Date(item.createdAt);
    if (isSameDay(date, now)) {
      groups["Hoje"].push(item);
    } else if (isSameDay(date, yesterday)) {
      groups["Ontem"].push(item);
    } else if (date >= weekAgo) {
      groups["Esta semana"].push(item);
    } else {
      groups["Anteriores"].push(item);
    }
  }

  return groups;
}

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
      <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-blue-400" />
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
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials || "?"}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-9 h-9 bg-white/10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  function getToken(): string | null {
    return typeof window !== "undefined"
      ? localStorage.getItem("detailhub_access_token")
      : null;
  }

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    const token = getToken();
    if (!token) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkRead(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // Non-critical
    }
  }

  async function handleDelete(id: string) {
    const token = getToken();
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) handleMarkRead(notification.id);
    if (notification.link) router.push(notification.link);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupNotifications(notifications);
  const groupOrder: GroupKey[] = ["Hoje", "Ontem", "Esta semana", "Anteriores"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-medium">Nenhuma notificação</p>
            <p className="text-gray-500 text-sm">
              Você está em dia com tudo!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {groupOrder.map((groupKey) => {
              const items = groups[groupKey];
              if (items.length === 0) return null;

              return (
                <div key={groupKey}>
                  {/* Group label */}
                  <div className="px-4 py-2 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {groupKey}
                    </span>
                  </div>

                  {/* Items */}
                  {items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-3 group relative transition-colors ${
                        !notification.isRead
                          ? "bg-blue-500/5 hover:bg-blue-500/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      {/* Unread dot */}
                      {!notification.isRead && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      )}

                      {/* Avatar */}
                      <ActorAvatar actor={notification.actor} />

                      {/* Content — clickable area */}
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p
                          className={`text-sm leading-snug ${
                            notification.isRead
                              ? "text-gray-300"
                              : "text-white font-medium"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={deletingId === notification.id}
                        title="Excluir notificação"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0 disabled:opacity-30"
                      >
                        {deletingId === notification.id ? (
                          <div className="w-3.5 h-3.5 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
