"use client";

// =============================================================================
// PostDetail — full post view: title, body, reactions, comment list, compose
// Fetches GET /api/posts/${postId}, handles reactions and comment submission
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2, MessageCircle, Hash } from "lucide-react";
import Link from "next/link";
import ReactionBar from "@/components/feed/ReactionBar";
import CommentItem, { CommentData } from "@/components/feed/CommentItem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface PostReaction {
  type: string;
  userId: string;
}

interface FullPost {
  id: string;
  title?: string | null;
  body: string;
  type: string;
  isPinned: boolean;
  isLocked: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: Author;
  space: { id: string; name: string; slug: string };
  comments: CommentData[];
  reactions?: PostReaction[];
  attachments?: string[];
  _count: { reactions: number; comments: number };
}

interface PostDetailProps {
  postId: string;
  communitySlug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} minuto${m !== 1 ? "s" : ""}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} hora${h !== 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d !== 1 ? "s" : ""}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-50 rounded w-24" />
      <div className="h-8 bg-gray-50 rounded w-3/4" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-50 rounded w-32" />
          <div className="h-3 bg-gray-50 rounded w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-50 rounded" />
        <div className="h-4 bg-gray-50 rounded w-5/6" />
        <div className="h-4 bg-gray-50 rounded w-4/6" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostDetail({ postId, communitySlug }: PostDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Reaction state
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [reactionLoading, setReactionLoading] = useState(false);

  // Comment list
  const [comments, setComments] = useState<CommentData[]>([]);

  // Comment composer
  const [commentBody, setCommentBody] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Delete
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const uid = localStorage.getItem("detailhub_user_id");
      const role = localStorage.getItem("detailhub_user_role");
      setCurrentUserId(uid);

      const res = await fetch(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Erro ao carregar post.");
        return;
      }

      const p: FullPost = json.data;
      setPost(p);
      setComments(p.comments ?? []);

      // Check ownership: SUPER_ADMIN always owner; influencer checks their communities
      if (role === "SUPER_ADMIN") {
        setIsOwner(true);
      } else if (role === "INFLUENCER_ADMIN") {
        try {
          const mineRes = await fetch("/api/communities/mine", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const mineJson = await mineRes.json();
          if (mineJson.success && Array.isArray(mineJson.data)) {
            const owns = mineJson.data.some((c: { slug: string }) => c.slug === communitySlug);
            if (owns) setIsOwner(true);
          }
        } catch { /* non-critical */ }
      }

      // Build reaction counts from reactions array
      const counts: Record<string, number> = {};
      const myReactions: string[] = [];
      (p.reactions ?? []).forEach((r: PostReaction) => {
        counts[r.type] = (counts[r.type] ?? 0) + 1;
        if (r.userId === uid) myReactions.push(r.type);
      });
      // Fallback: if no reactions array, use likeCount for "like"
      if ((p.reactions ?? []).length === 0 && p._count.reactions > 0) {
        counts["like"] = p._count.reactions;
      }
      setReactions(counts);
      setUserReactions(myReactions);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Auto-focus comment textarea when ?focus=comment is in the URL
  useEffect(() => {
    if (loading) return;
    if (searchParams.get("focus") === "comment" && commentRef.current) {
      setTimeout(() => {
        commentRef.current?.focus();
        commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [loading, searchParams]);

  // ---- Reaction toggle -----------------------------------------------------

  async function handleReact(type: string) {
    if (reactionLoading || !post) return;
    setReactionLoading(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.success) {
        const reacted: boolean = json.data.reacted;
        setUserReactions((prev) =>
          reacted ? [...prev, type] : prev.filter((t) => t !== type)
        );
        setReactions((prev) => ({
          ...prev,
          [type]: reacted
            ? (prev[type] ?? 0) + 1
            : Math.max((prev[type] ?? 1) - 1, 0),
        }));
      }
    } catch {
      // silent
    } finally {
      setReactionLoading(false);
    }
  }

  // ---- Comment submit ------------------------------------------------------

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentLoading(true);
    setCommentError("");
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCommentError(json.error ?? "Erro ao comentar.");
        return;
      }
      setComments((prev) => [...prev, json.data]);
      setCommentBody("");
    } catch {
      setCommentError("Erro de conexão.");
    } finally {
      setCommentLoading(false);
    }
  }

  // ---- Delete post ---------------------------------------------------------

  async function handleDeletePost() {
    if (!window.confirm("Excluir este post permanentemente?")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("detailhub_access_token");
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.back();
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  // ---- Render --------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <PostSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error || "Post não encontrado."}</p>
          <button
            onClick={() => router.back()}
            className="mt-3 text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const initials = `${post.author.firstName[0] ?? ""}${post.author.lastName[0] ?? ""}`.toUpperCase();
  const isAuthor = currentUserId === post.author.id;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Post card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Space breadcrumb */}
        <Link
          href={`/community/${communitySlug}/feed/${post.space.slug}`}
          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mb-4 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Hash className="w-3 h-3" />
          {post.space.name}
        </Link>

        {/* Title */}
        {post.title && (
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
            {post.title}
          </h1>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-violet-600/70 flex items-center justify-center text-sm font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-700">{authorName}</p>
            <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          )}
        </div>

        {/* Body */}
        {post.body && post.body.trim() !== " " && (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.body}
          </p>
        )}

        {/* Images */}
        {post.attachments && post.attachments.length > 0 && (
          <div className={`mt-4 grid gap-2 ${post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt=""
                  className="w-full rounded-xl object-cover border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in max-h-96"
                />
              </a>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <ReactionBar
            postId={postId}
            reactions={reactions}
            userReactions={userReactions}
            onReact={handleReact}
          />
        </div>
      </div>

      {/* Comments section */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-4">
          <MessageCircle className="w-4 h-4" />
          {comments.length} comentário{comments.length !== 1 ? "s" : ""}
        </h2>

        {/* Comment composer */}
        {!post.isLocked && (
          <form onSubmit={handleComment} className="mb-6 flex flex-col gap-2">
            <textarea
              ref={commentRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={3}
              required
              className="w-full bg-white border border-gray-200 hover:border-violet-200 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
            />
            {commentError && (
              <p className="text-xs text-red-400">{commentError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading || !commentBody.trim()}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              >
                {commentLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Comentar"
                )}
              </button>
            </div>
          </form>
        )}

        {post.isLocked && (
          <p className="text-xs text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6">
            Este post está bloqueado. Comentários desativados.
          </p>
        )}

        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">
            Seja o primeiro a comentar.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId ?? undefined}
                isOwner={isOwner}
                onDelete={(id) =>
                  setComments((prev) => prev.filter((c) => c.id !== id))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
