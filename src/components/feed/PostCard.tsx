"use client";

// =============================================================================
// PostCard — summary card for a post shown in the space feed list
// Displays author, timestamp, pinned badge, title/body preview, reaction counts
// Clicking the card navigates to the full post detail page
// Owner sees ⋯ menu for pin/hide moderation actions
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ThumbsUp, Pin, MoreHorizontal, EyeOff, Eye } from "lucide-react";
import ReactionBar from "@/components/feed/ReactionBar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface PostReaction {
  type: string;
  userId: string;
}

export interface PostCardProps {
  post: {
    id: string;
    title?: string | null;
    body: string;
    type: string;
    author: PostAuthor;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    isPinned: boolean;
    isHidden?: boolean;
    attachments?: string[];
    reactions?: PostReaction[];
    reactionCounts?: Record<string, number>;
    userReactions?: string[];
    _count?: { reactions?: number; comments?: number };
  };
  communitySlug: string;
  spaceSlug: string;
  currentUserId?: string;
  isOwner?: boolean;
  onPostUpdate?: (updated: { id: string; isPinned?: boolean; isHidden?: boolean }) => void;
  onReact?: (type: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: relative time without date-fns
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "agora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin !== 1 ? "s" : ""}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} hora${diffH !== 1 ? "s" : ""}`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `há ${diffD} dia${diffD !== 1 ? "s" : ""}`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `há ${diffMo} ${diffMo !== 1 ? "meses" : "mês"}`;
  const diffY = Math.floor(diffMo / 12);
  return `há ${diffY} ano${diffY !== 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Image grid
// ---------------------------------------------------------------------------

function ImageGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt=""
        className="w-full max-h-72 object-cover rounded-lg mt-3 border border-gray-200"
      />
    );
  }
  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 mt-3">
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
        ))}
      </div>
    );
  }
  // 3+
  const shown = urls.slice(0, 4);
  const extra = urls.length - 4;
  return (
    <div className="grid grid-cols-2 gap-1 mt-3">
      {shown.map((url, i) => (
        <div key={i} className="relative">
          <img src={url} alt="" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostCard({
  post,
  communitySlug,
  spaceSlug,
  currentUserId,
  isOwner,
  onPostUpdate,
  onReact,
}: PostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const initials = `${post.author.firstName[0] ?? ""}${post.author.lastName[0] ?? ""}`.toUpperCase();
  const commentCount = post._count?.comments ?? post.commentCount;
  const likeCount = post._count?.reactions ?? post.likeCount;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  function handleClick() {
    router.push(`/community/${communitySlug}/posts/${post.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") handleClick();
  }

  async function handleModAction(field: "isPinned" | "isHidden", value: boolean) {
    setActionLoading(true);
    setMenuOpen(false);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await res.json();
      if (json.success && onPostUpdate) {
        onPostUpdate({ id: post.id, [field]: value });
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400/30 relative"
    >
      {/* Pinned badge */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-3">
          <Pin className="w-3.5 h-3.5" />
          Fixado
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {post.author.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt={authorName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-violet-600/70 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-gray-700 leading-tight">
            {authorName}
          </span>
          <span className="text-xs text-gray-500">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Owner moderation menu */}
        {isOwner && (
          <div
            className="ml-auto relative"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleModAction("isPinned", !post.isPinned)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Pin className="w-4 h-4" />
                  {post.isPinned ? "Desafixar" : "Fixar post"}
                </button>
                <button
                  type="button"
                  onClick={() => handleModAction("isHidden", !post.isHidden)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {post.isHidden ? (
                    <><Eye className="w-4 h-4" /> Mostrar</>
                  ) : (
                    <><EyeOff className="w-4 h-4" /> Ocultar</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="text-base font-semibold text-gray-900 mb-1.5 leading-snug">
          {post.title}
        </h2>
      )}

      {/* Body preview */}
      {post.body && post.body.trim() !== " " && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
          {post.body}
        </p>
      )}

      {/* Image thumbnails */}
      {post.attachments && post.attachments.length > 0 && (
        <ImageGrid urls={post.attachments} />
      )}

      {/* Footer: reactions + comments */}
      <div
        className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {post.reactionCounts && onReact ? (
          <ReactionBar
            postId={post.id}
            reactions={post.reactionCounts}
            userReactions={post.userReactions ?? []}
            onReact={onReact}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <ThumbsUp className="w-3.5 h-3.5" />
            {likeCount}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
          <MessageCircle className="w-3.5 h-3.5" />
          {commentCount}
        </span>
      </div>
    </article>
  );
}
