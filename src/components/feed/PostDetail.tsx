"use client";

// =============================================================================
// PostDetail — full post view: title, body, reactions, comment list, compose
// Fetches GET /api/posts/${postId}, handles reactions and comment submission
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Trash2, MessageCircle, Hash, Paperclip, FileText, Download, X, Smile, ImageIcon, Video, Link2 } from "lucide-react";
import Link from "next/link";
import ReactionBar from "@/components/feed/ReactionBar";
import CommentItem, { CommentData, CommentAttachment } from "@/components/feed/CommentItem";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";
import { uploadFiles } from "@/utils/upload";
import { EMOJI_CATS } from "@/lib/emoji-data";
import { compressImage, validateVideoFile, checkVideoDuration } from "@/lib/media-optimize";

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
      <div className="h-4 bg-white/10 rounded w-24" />
      <div className="h-8 bg-white/10 rounded w-3/4" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/10 rounded w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
        <div className="h-4 bg-white/10 rounded w-4/6" />
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
  const [uploadingComment, setUploadingComment] = useState(false);

  // Comment images/GIFs
  const [commentImageFiles, setCommentImageFiles] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [uploadingCommentImages, setUploadingCommentImages] = useState(false);
  const commentImageRef = useRef<HTMLInputElement>(null);

  // Comment video
  const [commentVideoFile, setCommentVideoFile] = useState<File | null>(null);
  const [commentVideoPreview, setCommentVideoPreview] = useState("");
  const [commentVideoError, setCommentVideoError] = useState("");
  const [uploadingCommentVideo, setUploadingCommentVideo] = useState(false);
  const [commentVideoMenuOpen, setCommentVideoMenuOpen] = useState(false);
  const [commentVideoEmbedUrl, setCommentVideoEmbedUrl] = useState("");
  const [commentShowEmbed, setCommentShowEmbed] = useState(false);
  const commentVideoRef = useRef<HTMLInputElement>(null);
  const commentVideoMenuRef = useRef<HTMLDivElement>(null);

  // Comment docs
  const [commentDocFiles, setCommentDocFiles] = useState<{ name: string; size: number; file: File }[]>([]);
  const [uploadingCommentDocs, setUploadingCommentDocs] = useState(false);
  const commentDocRef = useRef<HTMLInputElement>(null);

  // Comment emoji
  const [commentEmojiOpen, setCommentEmojiOpen] = useState(false);
  const [commentEmojiTab, setCommentEmojiTab] = useState(0);
  const commentEmojiPickerRef = useRef<HTMLDivElement>(null);

  // Comment link
  const [commentLinkVal, setCommentLinkVal] = useState("");
  const [commentShowLink, setCommentShowLink] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ---------------------------------------------------------------------------

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
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
  }, [postId, communitySlug]);

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

    // Optimistic update — instant UI feedback
    const wasReacted = userReactions.includes(type);
    setUserReactions((prev) =>
      wasReacted ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setReactions((prev) => ({
      ...prev,
      [type]: wasReacted
        ? Math.max((prev[type] ?? 1) - 1, 0)
        : (prev[type] ?? 0) + 1,
    }));

    setReactionLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!json.success) {
        // Revert on error
        setUserReactions((prev) =>
          wasReacted ? [...prev, type] : prev.filter((t) => t !== type)
        );
        setReactions((prev) => ({
          ...prev,
          [type]: wasReacted
            ? (prev[type] ?? 0) + 1
            : Math.max((prev[type] ?? 1) - 1, 0),
        }));
      }
    } catch {
      // Revert on network error
      setUserReactions((prev) =>
        wasReacted ? [...prev, type] : prev.filter((t) => t !== type)
      );
      setReactions((prev) => ({
        ...prev,
        [type]: wasReacted
          ? (prev[type] ?? 0) + 1
          : Math.max((prev[type] ?? 1) - 1, 0),
      }));
    } finally {
      setReactionLoading(false);
    }
  }

  // ---- Comment media helpers -----------------------------------------------

  function insertCommentEmoji(emoji: string) {
    const textarea = commentRef.current;
    if (!textarea) { setCommentBody((prev) => prev + emoji); return; }
    const start = textarea.selectionStart ?? commentBody.length;
    const end = textarea.selectionEnd ?? commentBody.length;
    const newBody = commentBody.substring(0, start) + emoji + commentBody.substring(end);
    setCommentBody(newBody);
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  }

  function handleCommentImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...commentImageFiles, ...files].slice(0, 10);
    setCommentImageFiles(combined);
    setCommentImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    if (commentImageRef.current) commentImageRef.current.value = "";
  }

  async function handleCommentVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (commentVideoRef.current) commentVideoRef.current.value = "";
    setCommentVideoError("");
    const sizeErr = validateVideoFile(file);
    if (sizeErr) { setCommentVideoError(sizeErr); return; }
    const durErr = await checkVideoDuration(file);
    if (durErr) { setCommentVideoError(durErr); return; }
    setCommentVideoFile(file);
    setCommentVideoPreview(URL.createObjectURL(file));
  }

  function handleCommentDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setCommentDocFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, file: f }))].slice(0, 5));
    if (commentDocRef.current) commentDocRef.current.value = "";
  }

  // ---- Comment submit ------------------------------------------------------

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const hasContent = commentBody.trim() || commentImageFiles.length || commentVideoFile ||
      commentVideoEmbedUrl.trim() || commentDocFiles.length;
    if (!hasContent) return;
    setCommentLoading(true);
    setCommentError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      type AttItem = string | { url: string; name: string; size: number; mediaType?: string };
      let attachments: AttItem[] = [];

      // Upload images (compressed)
      if (commentImageFiles.length > 0) {
        setUploadingCommentImages(true);
        try {
          const compressed = await Promise.all(commentImageFiles.map((f) => compressImage(f, 1)));
          const uploaded = await uploadFiles(compressed, "posts");
          attachments = uploaded.map((f) => f.url);
        } catch {
          setCommentError("Erro ao enviar imagens. Tente novamente.");
          return;
        } finally {
          setUploadingCommentImages(false);
        }
      }

      // Upload video
      if (commentVideoFile) {
        setUploadingCommentVideo(true);
        try {
          const uploaded = await uploadFiles([commentVideoFile], "posts");
          const v = uploaded[0];
          attachments = [...attachments, { url: v.url, name: v.name, size: v.size, mediaType: "video" }];
        } catch {
          setCommentError("Erro ao enviar vídeo. Tente novamente.");
          return;
        } finally {
          setUploadingCommentVideo(false);
        }
      }

      // Embed URL
      if (commentVideoEmbedUrl.trim()) {
        attachments = [...attachments, { url: commentVideoEmbedUrl.trim(), name: "video-embed", size: 0, mediaType: "video-embed" }];
      }

      // Upload docs
      if (commentDocFiles.length > 0) {
        setUploadingComment(true);
        try {
          const uploaded = await uploadFiles(commentDocFiles.map((d) => d.file), "posts");
          const withTypes = uploaded.map((f) => {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            return { url: f.url, name: f.name, size: f.size, mediaType: ext === "pdf" ? "pdf" : "doc" };
          });
          attachments = [...attachments, ...withTypes];
        } catch {
          setCommentError("Erro ao enviar arquivos. Tente novamente.");
          return;
        } finally {
          setUploadingComment(false);
        }
      }

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: commentBody.trim() || " ", attachments }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCommentError(json.error ?? "Erro ao comentar.");
        return;
      }
      setComments((prev) => [...prev, json.data]);
      setCommentBody("");
      commentImagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setCommentImageFiles([]); setCommentImagePreviews([]);
      if (commentVideoPreview) URL.revokeObjectURL(commentVideoPreview);
      setCommentVideoFile(null); setCommentVideoPreview(""); setCommentVideoError("");
      setCommentVideoEmbedUrl(""); setCommentShowEmbed(false);
      setCommentDocFiles([]);
      setCommentShowLink(false); setCommentLinkVal("");
    } catch {
      setCommentError("Erro de conexão.");
    } finally {
      setCommentLoading(false);
      setUploadingComment(false);
    }
  }

  // ---- Delete post ---------------------------------------------------------

  function handleDeletePost() {
    setConfirmDelete(true);
  }

  async function doDeletePost() {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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
            className="mt-3 text-xs text-gray-400 hover:text-[#EEE6E4] transition-colors"
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
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Post card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        {/* Space breadcrumb */}
        <Link
          href={`/community/${communitySlug}/feed/${post.space.slug}`}
          className="inline-flex items-center gap-1 text-xs text-[#009CD9] hover:text-[#009CD9] mb-4 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Hash className="w-3 h-3" />
          {post.space.name}
        </Link>

        {/* Title */}
        {post.title && (
          <h1 className="text-2xl font-bold text-[#EEE6E4] mb-4 leading-snug">
            {post.title}
          </h1>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={authorName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#006079]/70 flex items-center justify-center text-sm font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#EEE6E4]">{authorName}</p>
            <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          )}
        </div>

        {/* Body */}
        {post.body && post.body.trim() !== " " && (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.body}
          </p>
        )}

        {/* Images */}
        {post.attachments && post.attachments.length > 0 && (
          <div className={`mt-4 grid gap-2 ${post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={url}
                  alt=""
                  width={800}
                  height={384}
                  className="w-full rounded-xl object-cover border border-white/10 hover:opacity-90 transition-opacity cursor-zoom-in max-h-96"
                />
              </a>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div className="mt-5 pt-4 border-t border-white/10">
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
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#EEE6E4] mb-4">
          <MessageCircle className="w-4 h-4 text-[#009CD9]" />
          {comments.length > 0 ? `${comments.length} comentário${comments.length !== 1 ? "s" : ""}` : "Comentários"}
        </h2>

        {/* Comment composer */}
        {!post.isLocked && (
          <form onSubmit={handleComment} className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <textarea
              ref={commentRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={3}
              className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-400 focus:outline-none resize-none transition-all"
            />

            {/* Image previews */}
            {commentImagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {commentImagePreviews.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <Image src={url} alt="" width={72} height={72}
                      unoptimized={commentImageFiles[idx]?.type === "image/gif"}
                      className="w-18 h-18 object-cover rounded-lg border border-white/10"
                      style={{ width: 72, height: 72 }}
                    />
                    <button type="button" onClick={() => {
                      URL.revokeObjectURL(url);
                      setCommentImageFiles((p) => p.filter((_, i) => i !== idx));
                      setCommentImagePreviews((p) => p.filter((_, i) => i !== idx));
                    }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {commentImageFiles[idx]?.type === "image/gif" && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/70 text-white rounded px-1">GIF</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Video preview */}
            {commentVideoPreview && (
              <div>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={commentVideoPreview} controls className="w-full max-h-40 rounded-lg border border-white/10 bg-black" />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400 truncate">{commentVideoFile?.name}</span>
                  <button type="button" onClick={() => {
                    URL.revokeObjectURL(commentVideoPreview);
                    setCommentVideoFile(null); setCommentVideoPreview(""); setCommentVideoError("");
                  }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-2 flex-shrink-0">
                    <X className="w-3 h-3" /> Remover
                  </button>
                </div>
              </div>
            )}
            {commentVideoError && <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">{commentVideoError}</p>}

            {/* Embed URL input */}
            {commentShowEmbed && !commentVideoFile && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Link2 className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
                <input type="url" value={commentVideoEmbedUrl} onChange={(e) => setCommentVideoEmbedUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                />
                {commentVideoEmbedUrl.trim() && <span className="text-xs text-[#009CD9]">✓</span>}
                <button type="button" onClick={() => { setCommentShowEmbed(false); setCommentVideoEmbedUrl(""); }} className="text-gray-500 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Doc previews */}
            {commentDocFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {commentDocFiles.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${doc.name.toLowerCase().endsWith(".pdf") ? "text-red-400" : "text-[#009CD9]"}`} />
                    <span className="flex-1 text-xs text-gray-300 truncate">{doc.name}</span>
                    <span className="text-xs text-gray-600 flex-shrink-0">{(doc.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setCommentDocFiles((p) => p.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Link input */}
            {commentShowLink && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Link2 className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
                <input type="url" value={commentLinkVal} onChange={(e) => setCommentLinkVal(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (commentLinkVal.trim()) { setCommentBody((prev) => prev + (prev ? "\n" : "") + commentLinkVal.trim()); setCommentLinkVal(""); setCommentShowLink(false); } } }}
                  className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                />
                <button type="button" onClick={() => { if (commentLinkVal.trim()) setCommentBody((prev) => prev + (prev ? "\n" : "") + commentLinkVal.trim()); setCommentLinkVal(""); setCommentShowLink(false); }} className="text-xs text-[#009CD9] hover:text-[#007A99] font-medium transition-colors">Inserir</button>
                <button type="button" onClick={() => { setCommentShowLink(false); setCommentLinkVal(""); }} className="text-gray-500 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {commentError && <p className="text-xs text-red-400">{commentError}</p>}

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-t border-white/10 pt-3 flex-wrap">

              {/* Emoji */}
              <div className="relative flex-shrink-0" ref={commentEmojiPickerRef}>
                <button type="button" onClick={() => setCommentEmojiOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors ${commentEmojiOpen ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                  title="Emoji"
                  onBlur={(e) => { if (!commentEmojiPickerRef.current?.contains(e.relatedTarget as Node)) setCommentEmojiOpen(false); }}
                >
                  <Smile className="w-3.5 h-3.5" /><span className="hidden sm:inline">Emoji</span>
                </button>
                {commentEmojiOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex border-b border-white/10">
                      {EMOJI_CATS.map((cat, i) => (
                        <button key={i} type="button" onClick={() => setCommentEmojiTab(i)} title={cat.title}
                          className={`flex-1 py-2 text-base transition-colors hover:bg-white/5 ${commentEmojiTab === i ? "bg-white/10" : ""}`}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] text-gray-500 px-1 mb-1.5 font-medium uppercase tracking-wide">{EMOJI_CATS[commentEmojiTab].title}</p>
                      <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
                        {EMOJI_CATS[commentEmojiTab].emojis.map((emoji, i) => (
                          <button key={i} type="button" onClick={() => insertCommentEmoji(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Foto/GIF */}
              <button type="button" onClick={() => commentImageRef.current?.click()}
                disabled={commentImageFiles.length >= 10 || !!commentVideoFile}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
                title="Foto ou GIF">
                <ImageIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Foto/GIF</span>
                {commentImageFiles.length > 0 && <span className="text-[#009CD9]">({commentImageFiles.length})</span>}
              </button>

              {/* Vídeo */}
              <div className="relative flex-shrink-0" ref={commentVideoMenuRef}>
                <button type="button"
                  onClick={() => { if (!commentVideoFile && !commentVideoEmbedUrl && commentImageFiles.length === 0) setCommentVideoMenuOpen((v) => !v); }}
                  disabled={(!!commentVideoFile || !!commentVideoEmbedUrl) && !commentVideoMenuOpen}
                  className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${(commentVideoFile || commentVideoEmbedUrl) ? "text-[#009CD9] bg-[#006079]/20" : commentVideoMenuOpen ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                  title="Vídeo">
                  <Video className="w-3.5 h-3.5" /><span className="hidden sm:inline">Vídeo</span>
                </button>
                {commentVideoMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button type="button" onClick={() => { commentVideoRef.current?.click(); setCommentVideoMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors">
                      <Paperclip className="w-3.5 h-3.5 text-[#009CD9]" />Upload arquivo<span className="ml-auto text-[10px] text-gray-500">MP4/WebM</span>
                    </button>
                    <button type="button" onClick={() => { setCommentShowEmbed(true); setCommentVideoMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors border-t border-white/5">
                      <Link2 className="w-3.5 h-3.5 text-[#009CD9]" />Embedar URL<span className="ml-auto text-[10px] text-gray-500">YouTube/Vimeo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PDF/Arquivo */}
              <button type="button" onClick={() => commentDocRef.current?.click()}
                disabled={commentDocFiles.length >= 5 || !!commentVideoFile}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
                title="PDF ou arquivo (máx 5)">
                <Paperclip className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
                {commentDocFiles.length > 0 && <span className="text-[#009CD9]">({commentDocFiles.length})</span>}
              </button>

              {/* Link */}
              <button type="button" onClick={() => setCommentShowLink((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 ${commentShowLink ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                title="Inserir link">
                <Link2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Link</span>
              </button>

              <div className="flex-1" />

              {/* Comentar */}
              <button type="submit"
                disabled={commentLoading || uploadingComment || uploadingCommentImages || uploadingCommentVideo || uploadingCommentDocs ||
                  !(commentBody.trim() || commentImageFiles.length || commentVideoFile || commentVideoEmbedUrl.trim() || commentDocFiles.length)}
                className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all flex-shrink-0">
                {(uploadingCommentImages || uploadingCommentVideo || uploadingComment || uploadingCommentDocs) ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                ) : commentLoading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publicando...</>
                ) : "Comentar"}
              </button>
            </div>

            {/* Hidden inputs */}
            <input ref={commentImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCommentImageSelect} />
            <input ref={commentVideoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleCommentVideoSelect} />
            <input ref={commentDocRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" multiple className="hidden" onChange={handleCommentDocSelect} />
          </form>
        )}

        {post.isLocked && (
          <p className="text-xs text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6">
            Este post está bloqueado. Comentários desativados.
          </p>
        )}

        {/* Comment list */}
        {comments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-400">Seja o primeiro a comentar.</p>
          </div>
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

      <ConfirmModal
        isOpen={confirmDelete}
        title="Excluir post"
        description="Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={doDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
