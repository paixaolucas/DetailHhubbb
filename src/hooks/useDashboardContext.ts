"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export interface DashboardContextData {
  streak: number;
  absentDays: number;
  newContentSinceLogin: number;
  lastInfluencerWithContent: string | null;
  nextLive: {
    id: string;
    title: string;
    scheduledAt: string;
    status: string;
  } | null;
  unreadNotifications: number;
  isNewMember: boolean;
  pendingLessons: number;
  optedCommunities: number;
}

// Cache module-level para evitar fetches duplicados em re-renders
let _cachedData: DashboardContextData | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000;

export function useDashboardContext() {
  const [data, setData] = useState<DashboardContextData | null>(_cachedData);
  const [loading, setLoading] = useState(_cachedData === null);

  useEffect(() => {
    const now = Date.now();
    if (_cachedData && now - _cacheTime < CACHE_TTL) {
      setData(_cachedData);
      setLoading(false);
      return;
    }

    apiClient<DashboardContextData>("/api/dashboard/context")
      .then((d) => {
        if (d.success && d.data) {
          _cachedData = d.data;
          _cacheTime = Date.now();
          setData(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
