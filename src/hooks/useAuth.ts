"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const id = localStorage.getItem(STORAGE_KEYS.USER_ID) ?? "";
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
    const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) ?? "";
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE) ?? "";

    if (storedToken) {
      setToken(storedToken);
      setUser({ id, name, email, role });
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      setUser(null);
      setToken(null);
      router.push("/login");
    }
  }, [router]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    logout,
  };
}
