"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { getGreeting } from "@/lib/greeting";

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

function getDevFallbackBanner(firstName: string): DashboardBanner {
  return {
    imageUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80&auto=format&fit=crop",
    title: getGreeting(firstName),
    subtitle: "Explore as comunidades automotivas da plataforma.",
    statLabel: "Lives futuras",
    statValue: "5",
    isActive: true,
  };
}

export function HeroBanner({ firstName = "Aluno" }: { firstName?: string }) {
  const [banner, setBanner] = useState<DashboardBanner | null | undefined>(undefined);

  useEffect(() => {
    apiClient<DashboardBanner | null>("/api/dashboard/banner")
      .then((d) => {
        const resolved = d.success ? (d.data ?? null) : null;
        if (!resolved && process.env.NODE_ENV === "development") {
          setBanner(getDevFallbackBanner(firstName));
        } else {
          setBanner(resolved);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV === "development") {
          setBanner(getDevFallbackBanner(firstName));
        } else {
          setBanner(null);
        }
      });
  }, [firstName]);

  return (
    <div className="space-y-3">
      {/* Hero banner */}
      {banner === undefined ? (
        <div className="h-[220px] sm:h-[260px] bg-white/5 animate-pulse rounded-xl" />
      ) : banner ? (
        <div className="relative overflow-hidden h-[220px] sm:h-[260px] rounded-xl">
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay — strong on left for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />

          <div className="relative h-full flex flex-col justify-end p-5 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              {/* Left — greeting + subtitle + CTA */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {banner.title}
                </h1>
                {banner.subtitle && (
                  <p className="text-white/60 text-sm mt-1">{banner.subtitle}</p>
                )}
                {banner.ctaText && banner.ctaUrl && (
                  <Link
                    href={banner.ctaUrl}
                    className="inline-block mt-3 bg-[#009CD9] hover:bg-[#007A99] transition-colors text-white font-semibold px-5 py-2 rounded-xl text-sm"
                  >
                    {banner.ctaText}
                  </Link>
                )}
              </div>

              {/* Right — stat card */}
              {banner.statValue && banner.statLabel && (
                <div className="flex-shrink-0 text-center bg-black/50 backdrop-blur-sm border border-white/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
                  <p className="text-3xl sm:text-4xl font-black text-white leading-none">
                    {banner.statValue}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">{banner.statLabel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Advertiser banners */}
      <BannerCarousel />
    </div>
  );
}
