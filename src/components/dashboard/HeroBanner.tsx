"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { BannerCarousel } from "@/components/ui/BannerCarousel";

interface DashboardBanner {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  statLabel?: string;
  statValue?: string;
  isActive: boolean;
}

function getDevFallbackBanner(): DashboardBanner {
  return {
    imageUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80&auto=format&fit=crop",
    title: "A paixão pelo automotivo une quem realmente entende.",
    subtitle: "Comunidades exclusivas, conteúdo real e pessoas que vivem isso.",
    statLabel: "Lives futuras",
    statValue: "5",
    isActive: true,
  };
}

export function HeroBanner() {
  const [banner, setBanner] = useState<DashboardBanner | null | undefined>(undefined);

  useEffect(() => {
    apiClient<DashboardBanner | null>("/api/dashboard/banner")
      .then((d) => {
        const resolved = d.success ? (d.data ?? null) : null;
        if (!resolved && process.env.NODE_ENV === "development") {
          setBanner(getDevFallbackBanner());
        } else {
          setBanner(resolved);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") {
          setBanner(getDevFallbackBanner());
        } else {
          setBanner(null);
        }
      });
  }, []);

  return (
    <div className="space-y-3">
      {/* Hero banner */}
      {banner === undefined ? (
        <div className="h-[280px] sm:h-[340px] lg:h-[400px] bg-white/5 animate-pulse rounded-2xl" />
      ) : banner ? (
        <div className="relative overflow-hidden h-[280px] sm:h-[340px] lg:h-[400px] rounded-2xl">
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      ) : (
        <div className="relative overflow-hidden h-[280px] sm:h-[340px] lg:h-[400px] rounded-2xl bg-gradient-to-br from-[#0D1F26] via-[#061A22] to-[#0D0D0D] flex items-end p-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #006079 0%, transparent 60%), radial-gradient(circle at 80% 20%, #009CD9 0%, transparent 50%)" }} />
          <div className="relative space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#009CD9]">Detailer&apos;HUB</p>
            <p className="text-2xl sm:text-3xl font-black text-[#EEE6E4] leading-tight max-w-lg">
              A paixão pelo automotivo une quem realmente entende.
            </p>
            <p className="text-sm text-gray-400">Comunidades exclusivas, conteúdo real e pessoas que vivem isso.</p>
          </div>
        </div>
      )}

      {/* Advertiser banners */}
      <BannerCarousel />
    </div>
  );
}
