"use client";

// =============================================================================
// CommunityTabs — sticky tab bar for community pages (Feed / Trilhas / Lives / Membros)
// Active tab is detected via pathname prefix matching.
// hasLive shows a pulsing red dot next to the Lives tab when a live is active.
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
  matchPrefix: string;
  key: string;
}

interface CommunityTabsProps {
  communitySlug: string;
  primaryColor?: string;
  hasLive?: boolean;
}

export function CommunityTabs({
  communitySlug,
  primaryColor = "#009CD9",
  hasLive = false,
}: CommunityTabsProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      key: "feed",
      label: "Feed",
      href: `/community/${communitySlug}/feed`,
      matchPrefix: `/community/${communitySlug}/feed`,
    },
    {
      key: "trilhas",
      label: "Trilhas",
      href: `/community/${communitySlug}/trilhas`,
      matchPrefix: `/community/${communitySlug}/trilhas`,
    },
    {
      key: "lives",
      label: "Lives",
      href: `/community/${communitySlug}/lives`,
      matchPrefix: `/community/${communitySlug}/lives`,
    },
    {
      key: "members",
      label: "Membros",
      href: `/community/${communitySlug}/members`,
      matchPrefix: `/community/${communitySlug}/members`,
    },
  ];

  return (
    <div className="bg-[#151515] border-b border-white/8 sticky top-0 z-20 flex-shrink-0">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.matchPrefix);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={[
                  "px-4 py-3 text-sm font-medium transition-colors border-b-2 flex-shrink-0 whitespace-nowrap flex items-center gap-1",
                  isActive
                    ? "text-[#EEE6E4]"
                    : "text-gray-500 hover:text-gray-300",
                ].join(" ")}
                style={{
                  borderBottomColor: isActive ? primaryColor : "transparent",
                  color: isActive ? "#EEE6E4" : undefined,
                }}
              >
                {tab.label}
                {tab.key === "lives" && hasLive && (
                  <span className="inline-flex w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CommunityTabs;
