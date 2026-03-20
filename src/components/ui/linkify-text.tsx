"use client";

// =============================================================================
// LinkifyText — renders text with auto-detected URLs as clickable <a> links
// =============================================================================

import React from "react";

const URL_REGEX = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?()\]])/g;

interface LinkifyTextProps {
  text: string;
  className?: string;
}

export function LinkifyText({ text, className }: LinkifyTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#009CD9] hover:text-[#007A99] hover:underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
