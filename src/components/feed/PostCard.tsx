"use client";

// =============================================================================
// PostCard — summary card for a post shown in the space feed list
// Owner/Admin sees ⋯ menu with: pin, hide/show, delete (with confirmation)
// =============================================================================

import { useState, useRef, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle, ThumbsUp, Pin, MoreHorizontal, EyeOff, Eye, Trash2, FileText, Download } from "lucide-react";
import { LinkifyText } from "@/components/ui/linkify-text";
import ReactionBar from "@/components/feed/ReactionBar";
import { useToast } from "@/components/ui/toast-provider";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";
import VideoEmbed from "@/components/ui/VideoEmbed";

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
    attachments?: (string | { url: string; name: string; size?: number; mediaType?: string })[];
    reactions?: PostReaction[];
    reactionCounts?: Record<string, number>;
    userReactions?: string[];
    videoAspect?: string | null;
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
        className="w-full max-h-72 object-cover rounded-lg mt-3 border border-white/10"
      />
    );
  }
  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 mt-3">
        {urls.map((url, i) => (
          <Image key={i} src={url} alt="" width={400} height={144} className="w-full h-36 object-cover rounded-lg border border-white/10" />
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
          <Image src={url} alt="" width={400} height={144} className="w-full h-36 object-cover rounded-lg border border-white/10" />
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

function PostCard({
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
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
        className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009CD9]/30 relative ${
          post.isHidden ? "opacity-50 border-white/5" : "border-white/10"
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
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#006079]/70 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#EEE6E4] leading-tight">{authorName}</span>
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
                className="p-1.5 text-gray-400 hover:text-gray-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  {/* Pin — owner only */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handlePin}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-[#EEE6E4] transition-colors"
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
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-[#EEE6E4] transition-colors"
                    >
                      {post.isHidden ? (
                        <><Eye className="w-4 h-4 text-green-500" /> Mostrar post</>
                      ) : (
                        <><EyeOff className="w-4 h-4 text-gray-400" /> Ocultar post</>
                      )}
                    </button>
                  )}
                  {/* Divider before delete */}
                  {isOwner && <div className="border-t border-white/10 my-1" />}
                  {/* Delete — author or owner */}
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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
          <h2 className="text-base font-semibold text-[#EEE6E4] mb-1.5 leading-snug">
            {post.title}
          </h2>
        )}

        {/* Body preview */}
        {post.body && post.body.trim() !== " " && (
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
            <LinkifyText text={post.body} />
          </p>
        )}

        {/* Video embed — only for YouTube/Vimeo URLs in body (legacy) */}
        {post.type === "VIDEO" && post.body && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/.test(post.body.trim()) && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <VideoEmbed
              url={post.body.trim()}
              title={post.title ?? undefined}
              aspectRatio={(post.videoAspect as "16:9" | "9:16" | "4:3") ?? "16:9"}
            />
          </div>
        )}

        {/* Attachments: images, videos, PDFs, files */}
        {post.attachments && post.attachments.length > 0 && (() => {
          type AttObj = { url: string; name: string; size?: number; mediaType?: string };
          const imageUrls: string[] = [];
          const videos: AttObj[] = [];
          const pdfs: AttObj[] = [];
          const files: AttObj[] = [];

          for (const att of post.attachments) {
            if (typeof att === "string") {
              imageUrls.push(att); // legacy: plain URL = image
            } else {
              const ext = att.name.split(".").pop()?.toLowerCase() ?? "";
              const mt = att.mediaType;
              if (mt === "video" || (!mt && ["mp4", "webm", "mov"].includes(ext))) {
                videos.push(att);
              } else if (mt === "pdf" || (!mt && ext === "pdf")) {
                pdfs.push(att);
              } else if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) {
                imageUrls.push(att.url);
              } else {
                files.push(att);
              }
            }
          }

          return (
            <>
              {/* Images / GIFs grid */}
              {imageUrls.length > 0 && <ImageGrid urls={imageUrls} />}

              {/* Inline videos */}
              {videos.map((v, idx) => (
                <div key={idx} className="mt-3" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={v.url}
                    controls
                    preload="metadata"
                    className="w-full max-h-80 rounded-lg border border-white/10 bg-black"
                  />
                </div>
              ))}

              {/* PDF cards */}
              {pdfs.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                  {pdfs.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg px-3 py-2.5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#EEE6E4] truncate font-medium">{file.name}</p>
                        <p className="text-[10px] text-gray-500">
                          PDF{file.size != null ? ` · ${(file.size / 1024).toFixed(0)} KB` : ""}
                        </p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-400 flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              )}

              {/* Other files */}
              {files.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                  {files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2.5 bg-white/5 border border-white/10 hover:border-[#006079]/40 hover:bg-white/10 rounded-lg px-3 py-2 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#006079]/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-[#009CD9]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#EEE6E4] truncate font-medium">{file.name}</p>
                        {file.size != null && <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>}
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#009CD9] flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Footer: reactions + comments */}
        <div
          className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10"
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
            className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto hover:text-[#009CD9] transition-colors"
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

export default memo(PostCard);
