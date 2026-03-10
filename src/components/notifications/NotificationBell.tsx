"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import {
  NotificationDropdown,
  type NotificationItem,
} from "./NotificationDropdown";

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getToken(): string | null {
    return typeof window !== "undefined"
      ? localStorage.getItem("detailhub_access_token")
      : null;
  }

  // ─── Fetch unread count (polled every 30s) ────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.data?.count ?? 0);
      }
    } catch {
      // Non-critical — ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ─── Fetch full list when dropdown opens ─────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data ?? []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) fetchNotifications();
  }

  // ─── Close on outside click ───────────────────────────────────────────────

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // ─── Mark single notification as read ────────────────────────────────────

  async function handleRead(id: string) {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Non-critical
    }
  }

  // ─── Mark all as read ────────────────────────────────────────────────────

  async function handleReadAll() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      // Non-critical
    }
  }

  // ─── Formatted badge label ────────────────────────────────────────────────

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="Notificações"
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          {loadingNotifications ? (
            <div className="w-80 bg-chrome-950 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center py-10">
              <div className="w-5 h-5 border-[2px] border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <NotificationDropdown
              notifications={notifications}
              onRead={handleRead}
              onReadAll={handleReadAll}
            />
          )}
        </div>
      )}
    </div>
  );
}
