"use client";

// =============================================================================
// SpaceSidebar — vertical channel list for community feed layout
// Shows spaces as links, highlights active space, shows icon/type label
// =============================================================================

import Link from "next/link";
import { Hash } from "lucide-react";

export interface SpaceItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  type?: string | null;
}

interface SpaceSidebarProps {
  communitySlug: string;
  spaces: SpaceItem[];
  activeSpaceSlug: string;
}

const SPACE_TYPE_LABELS: Record<string, string> = {
  DISCUSSION:    "Discussão",
  ANNOUNCEMENT:  "Avisos",
  QA:            "Perguntas",
  SHOWCASE:      "Showcase",
};

export default function SpaceSidebar({
  communitySlug,
  spaces,
  activeSpaceSlug,
}: SpaceSidebarProps) {
  return (
    <aside className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1 min-w-[180px]">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 px-2 py-1 mb-1">
        Canais
      </p>

      {spaces.length === 0 && (
        <p className="text-xs text-gray-600 px-2 py-2">Nenhum canal</p>
      )}

      {spaces.map((space) => {
        const isActive = space.slug === activeSpaceSlug;
        return (
          <Link
            key={space.id}
            href={`/community/${communitySlug}/feed/${space.slug}`}
            className={[
              "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all group",
              isActive
                ? "bg-violet-500/20 text-violet-300 font-medium"
                : "text-gray-400 hover:bg-violet-50 hover:text-gray-700",
            ].join(" ")}
            title={space.type ? SPACE_TYPE_LABELS[space.type] ?? space.type : undefined}
          >
            {space.icon ? (
              <span className="text-base leading-none w-4 text-center flex-shrink-0">
                {space.icon}
              </span>
            ) : (
              <Hash
                className={[
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-violet-400" : "text-gray-600 group-hover:text-gray-400",
                ].join(" ")}
              />
            )}
            <span className="truncate">{space.name}</span>
            {space.type && SPACE_TYPE_LABELS[space.type] && (
              <span
                className={[
                  "ml-auto text-[10px] rounded px-1 py-0.5 flex-shrink-0 hidden sm:block",
                  isActive
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-white text-gray-600",
                ].join(" ")}
              >
                {SPACE_TYPE_LABELS[space.type]}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
