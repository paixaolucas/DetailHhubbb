"use client";

// =============================================================================
// Short URL: detailhub.com/[slug] → /community/[slug]/feed
// Security: requires valid session + platform membership
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

export default function SlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [status, setStatus] = useState<"checking" | "not_found" | "no_access">("checking");

  useEffect(() => {
    async function resolve() {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      // Not logged in
      if (!token && !refreshToken) {
        router.replace(`/login?redirect=/${slug}`);
        return;
      }

      // Try to get a valid token
      let activeToken = token;
      if (!activeToken && refreshToken) {
        try {
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const data = await res.json();
          if (res.ok && data.data?.accessToken) {
            activeToken = data.data.accessToken;
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, activeToken!);
          }
        } catch {
          // ignore
        }
      }

      if (!activeToken) {
        router.replace(`/login?redirect=/${slug}`);
        return;
      }

      const headers = { Authorization: `Bearer ${activeToken}` };

      // Check community exists
      const communityRes = await fetch(`/api/communities?published=true`, { headers })
        .then((r) => r.json())
        .catch(() => null);

      if (!communityRes?.success) {
        router.replace("/inicio");
        return;
      }

      const communities: Array<{ slug: string }> = communityRes.communities ?? [];
      const exists = communities.some((c) => c.slug === slug);

      if (!exists) {
        setStatus("not_found");
        return;
      }

      // Check platform membership
      const membershipRes = await fetch("/api/platform-membership/me", { headers })
        .then((r) => r.json())
        .catch(() => null);

      if (!membershipRes?.success || !membershipRes?.data?.hasMembership) {
        router.replace("/dashboard/assinar");
        return;
      }

      // All good — redirect to community feed
      router.replace(`/community/${slug}/feed`);
    }

    resolve();
  }, [slug, router]);

  if (status === "not_found") {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#EEE6E4] mb-2">Comunidade não encontrada</p>
          <p className="text-gray-400 text-sm mb-6">O endereço <strong>/{slug}</strong> não existe na plataforma.</p>
          <a href="/inicio" className="text-[#007A99] hover:text-[#009CD9] font-medium text-sm transition-colors">
            Voltar ao início →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Redirecionando...</p>
      </div>
    </div>
  );
}
