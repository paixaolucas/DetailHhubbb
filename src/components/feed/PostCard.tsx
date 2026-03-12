"use client";

// =============================================================================
// PostCard — summary card for a post shown in the space feed list
// Owner/Admin sees ⋯ menu with: pin, hide/show, delete (with confirmation)
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle, ThumbsUp, Pin, MoreHorizontal, EyeOff, Eye, Trash2 } from "lucide-react";
import ReactionBar from "@/components/feed/ReactionBar";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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
  onPostDelete?: (id: string) => void;
  onReact?: (type: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: relative time
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
      <Image
        src={urls[0]}
        alt=""
        width={800}
        height={288}
        className="w-full max-h-72 object-cover rounded-lg mt-3 border border-gray-200"
      />
    );
  }
  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 mt-3">
        {urls.map((url, i) => (
          <Image key={i} src={url} alt="" width={400} height={144} className="w-full h-36 object-cover rounded-lg border border-gray-200" />
        ))}
      </div>
    );
  }
  const shown = urls.slice(0, 4);
  const extra = urls.length - 4;
  return (
    <div className="grid grid-cols-2 gap-1 mt-3">
      {shown.map((url, i) => (
        <div key={i} className="relative">
          <Image src={url} alt="" width={400} height={144} className="w-full h-36 object-cover rounded-lg border border-gray-200" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">+{extra}</span>
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
  onPostDelete,
  onReact,
}: PostCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const initials = `${post.author.firstName[0] ?? ""}${post.author.lastName[0] ?? ""}`.toUpperCase();
  const commentCount = post._count?.comments ?? post.commentCount;
  const likeCount = post._count?.reactions ?? post.likeCount;
  const isAuthor = post.author.id === currentUserId;
  const showMenu = isOwner || isAuthor;

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

  function handleCommentClick(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/community/${communitySlug}/posts/${post.id}?focus=comment`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") handleClick();
  }

  async function handlePin() {
    setActionLoading(true);
    setMenuOpen(false);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${post.id}/pin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        onPostUpdate?.({ id: post.id, isPinned: json.data.isPinned });
        toast.success(json.data.isPinned ? "Post fixado" : "Post desafixado");
      } else {
        toast.error(json.error ?? "Erro ao fixar post");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleHide() {
    setActionLoading(true);
    setMenuOpen(false);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${post.id}/hide`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        onPostUpdate?.({ id: post.id, isHidden: json.data.isHidden });
        toast.success(json.data.isHidden ? "Post ocultado" : "Post visível novamente");
      } else {
        toast.error(json.error ?? "Erro ao ocultar post");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setConfirmDelete(false);
    setActionLoading(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        onPostDelete?.(post.id);
        toast.success("Post excluído");
      } else {
        toast.error(json.error ?? "Erro ao excluir post");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`bg-white border rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400/30 relative ${
          post.isHidden ? "opacity-50 border-gray-100" : "border-gray-200"
        } ${post.isPinned ? "border-l-4 border-l-amber-400" : ""}`}
      >
        {/* Pinned badge */}
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium mb-3">
            <Pin className="w-3.5 h-3.5" />
            Fixado
          </div>
        )}

        {/* Hidden badge (only visible to owner) */}
        {post.isHidden && isOwner && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-3">
            <EyeOff className="w-3.5 h-3.5" />
            Oculto (visível apenas para você)
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={authorName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-violet-600/70 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-700 leading-tight">{authorName}</span>
            <span className="text-xs text-gray-500">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Moderation menu */}
          {showMenu && (
            <div
              className="ml-auto relative"
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  {/* Pin — owner only */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handlePin}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Pin className="w-4 h-4 text-amber-500" />
                      {post.isPinned ? "Desafixar post" : "Fixar post"}
                    </button>
                  )}
                  {/* Hide — owner only */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleHide}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {post.isHidden ? (
                        <><Eye className="w-4 h-4 text-green-500" /> Mostrar post</>
                      ) : (
                        <><EyeOff className="w-4 h-4 text-gray-400" /> Ocultar post</>
                      )}
                    </button>
                  )}
                  {/* Divider before delete */}
                  {isOwner && <div className="border-t border-gray-100 my-1" />}
                  {/* Delete — author or owner */}
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir post
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
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto hover:text-violet-500 transition-colors"
            title="Comentar"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {commentCount}
          </button>
        </div>
      </article>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={confirmDelete}
        title="Excluir post"
        description="Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
