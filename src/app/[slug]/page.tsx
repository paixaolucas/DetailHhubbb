"use client";

// =============================================================================
// Short URL: detailhub.com/[slug] → /community/[slug]/feed
// Security: requires valid session + platform membership
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [status, setStatus] = useState<"checking" | "not_found" | "no_access">("checking");

  useEffect(() => {
    async function resolve() {
      const token = localStorage.getItem("detailhub_access_token");
      const refreshToken = localStorage.getItem("detailhub_refresh_token");

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
            localStorage.setItem("detailhub_access_token", activeToken!);
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
        router.replace("/dashboard");
        return;
      }

      const communities: Array<{ slug: string }> = communityRes.data ?? [];
      const exists = communities.some((c) => c.slug === slug);

      if (!exists) {
        setStatus("not_found");
        return;
      }

      // Check platform membership
      const membershipRes = await fetch("/api/platform-membership/me", { headers })
        .then((r) => r.json())
        .catch(() => null);

      if (!membershipRes?.success || !membershipRes?.data?.isActive) {
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
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Comunidade não encontrada</p>
          <p className="text-gray-400 text-sm mb-6">O endereço <strong>/{slug}</strong> não existe na plataforma.</p>
          <a href="/dashboard" className="text-[#007A99] hover:text-[#009CD9] font-medium text-sm transition-colors">
            Voltar ao Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#007A99] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Redirecionando...</p>
      </div>
    </div>
  );
}
