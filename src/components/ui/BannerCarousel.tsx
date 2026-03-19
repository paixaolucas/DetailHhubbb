"use client";

// =============================================================================
// BannerCarousel — auto-rotating advertiser banner carousel
// Fetches from /api/ads/banners, rotates every 5s, shows nothing if no banners
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  description?: string | null;
  creativeUrl: string | null;
  targetUrl?: string | null;
  ctaText?: string | null;
  advertiser: { companyName: string; logoUrl?: string | null };
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ads/banners")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBanners(d.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  // Auto-rotate every 5s
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [banners.length, next]);

  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A] select-none group">
      {/* Sponsor label */}
      <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm text-[10px] text-gray-400 px-2 py-0.5 rounded-full">
        Patrocinado
      </div>

      {/* Banner image */}
      {banner.creativeUrl ? (
        <div className="relative w-full h-40 sm:h-52">
          <Image
            src={banner.creativeUrl}
            alt={banner.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-40 sm:h-52 bg-gradient-to-br from-[#006079]/30 to-[#009CD9]/20" />
      )}

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-end p-5">
        <div className="flex-1 min-w-0">
          <p className="text-[#EEE6E4] font-bold text-lg leading-tight mb-1 drop-shadow">{banner.title}</p>
          {banner.description && (
            <p className="text-white/70 text-sm line-clamp-2 mb-3">{banner.description}</p>
          )}
          {banner.targetUrl && (
            <Link
              href={banner.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 bg-[#006079] hover:bg-[#007A99] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {banner.ctaText ?? "Saiba mais"}
            </Link>
          )}
        </div>
      </div>

      {/* Navigation arrows (only if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-3 right-5 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
