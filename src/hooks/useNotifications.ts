import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null;
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
      // Silently ignore — bell count is non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
}
