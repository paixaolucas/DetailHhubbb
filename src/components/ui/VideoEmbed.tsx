"use client";

// =============================================================================
// VideoEmbed — responsive 16:9 embed for YouTube and Vimeo
// Falls back to an external link for unrecognized URLs
// =============================================================================

import { ExternalLink } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

function parseVideoUrl(url: string): { type: "youtube" | "vimeo" | "unknown"; id: string } {
  try {
    const parsed = new URL(url);

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v) return { type: "youtube", id: v };
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("?")[0];
      if (id) return { type: "youtube", id };
    }

    // Vimeo: vimeo.com/[number]
    if (parsed.hostname === "www.vimeo.com" || parsed.hostname === "vimeo.com") {
      const match = parsed.pathname.match(/^\/(\d+)/);
      if (match?.[1]) return { type: "vimeo", id: match[1] };
    }
  } catch {
    // invalid URL
  }

  return { type: "unknown", id: "" };
}

export default function VideoEmbed({ url, title, className = "" }: VideoEmbedProps) {
  const { type, id } = parseVideoUrl(url);

  if (type === "unknown" || !id) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-sm text-[#009CD9] hover:text-[#007A99] transition-colors underline underline-offset-2 ${className}`}
      >
        <ExternalLink className="w-4 h-4 flex-shrink-0" />
        {title ?? url}
      </a>
    );
  }

  const embedSrc =
    type === "youtube"
      ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
      : `https://player.vimeo.com/video/${id}?byline=0&portrait=0`;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden ${className}`} style={{ paddingTop: "56.25%" }}>
      <iframe
        src={embedSrc}
        title={title ?? (type === "youtube" ? "YouTube video" : "Vimeo video")}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
}
