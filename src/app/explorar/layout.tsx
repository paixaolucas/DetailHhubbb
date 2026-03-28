"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoType } from "@/components/ui/logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { STORAGE_KEYS } from "@/lib/constants";

interface ExplorarLayoutProps {
  children: ReactNode;
}

export default function ExplorarLayout({ children }: ExplorarLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const rawName =
    typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "")
      : "";
  const initials = rawName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Sticky header */}
      <header className="h-14 bg-[#1A1A1A]/90 border-b border-white/[0.08] sticky top-0 z-30 backdrop-blur-sm">
        <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
          {/* Left: logo linking to /inicio */}
          <Link href="/inicio" aria-label="Voltar para o início">
            <LogoType height={18} variant="light" />
          </Link>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 select-none"
              style={{
                background: "linear-gradient(135deg, #006079 0%, #009CD9 100%)",
              }}
              aria-label={`Avatar de ${rawName}`}
            >
              {initials || "U"}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
