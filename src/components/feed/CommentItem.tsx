"use client";

// =============================================================================
// CommentItem — displays a single comment with author, body, reactions,
// delete option, and inline reply form. Renders replies indented below.
// =============================================================================

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ThumbsUp, Trash2, CornerDownRight, Paperclip, FileText, Download, X, Smile, ImageIcon, Video, Link2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";
import { uploadFiles } from "@/utils/upload";
import { EMOJI_CATS } from "@/lib/emoji-data";
import { compressImage, validateVideoFile, checkVideoDuration } from "@/lib/media-optimize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface CommentAttachment {
  url: string;
  name: string;
  size?: number;
  mediaType?: string;
}

export interface CommentData {
  id: string;
  body: string;
  author: CommentAuthor;
  likeCount: number;
  createdAt: string;
  replies?: CommentData[];
  attachments?: (string | CommentAttachment)[];
  _count?: { reactions?: number };
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  currentUserId?: string;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  isReply?: boolean;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommentItem({
  comment,
  postId,
  currentUserId,
  isOwner = false,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [likeCount, setLikeCount] = useState(
    comment._count?.reactions ?? comment.likeCount
  );
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [localReplies, setLocalReplies] = useState<CommentData[]>(comment.replies ?? []);
  const [uploadingReply, setUploadingReply] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Reply images
  const [replyImageFiles, setReplyImageFiles] = useState<File[]>([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);
  const [uploadingReplyImages, setUploadingReplyImages] = useState(false);
  const replyImageRef = useRef<HTMLInputElement>(null);

  // Reply video
  const [replyVideoFile, setReplyVideoFile] = useState<File | null>(null);
  const [replyVideoPreview, setReplyVideoPreview] = useState("");
  const [replyVideoError, setReplyVideoError] = useState("");
  const [uploadingReplyVideo, setUploadingReplyVideo] = useState(false);
  const [replyVideoMenuOpen, setReplyVideoMenuOpen] = useState(false);
  const [replyVideoEmbedUrl, setReplyVideoEmbedUrl] = useState("");
  const [replyShowEmbed, setReplyShowEmbed] = useState(false);
  const replyVideoRef = useRef<HTMLInputElement>(null);
  const replyVideoMenuRef = useRef<HTMLDivElement>(null);

  // Reply docs
  const [replyDocFiles, setReplyDocFiles] = useState<{ name: string; size: number; file: File }[]>([]);
  const [uploadingReplyDocs, setUploadingReplyDocs] = useState(false);
  const replyDocRef = useRef<HTMLInputElement>(null);

  // Reply emoji
  const [replyEmojiOpen, setReplyEmojiOpen] = useState(false);
  const [replyEmojiTab, setReplyEmojiTab] = useState(0);
  const replyEmojiPickerRef = useRef<HTMLDivElement>(null);

  // Reply link
  const [replyLinkVal, setReplyLinkVal] = useState("");
  const [replyShowLink, setReplyShowLink] = useState(false);

  // Close video menu on outside click
  useEffect(() => {
    if (!replyVideoMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (replyVideoMenuRef.current && !replyVideoMenuRef.current.contains(e.target as Node)) {
        setReplyVideoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [replyVideoMenuOpen]);

  const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
  const initials = `${comment.author.firstName[0] ?? ""}${comment.author.lastName[0] ?? ""}`.toUpperCase();
  const canDelete = currentUserId === comment.author.id || isOwner;

  // ---- Like ----------------------------------------------------------------

  async function handleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/comments/${comment.id}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "like" }),
      });
      const json = await res.json();
      if (json.success) {
        setLiked(json.data.reacted);
        setLikeCount(json.data.likeCount);
      }
    } catch {
      // silent
    } finally {
      setLikeLoading(false);
    }
  }

  // ---- Delete --------------------------------------------------------------

  async function handleDelete() {
    setDeleting(true);
    setConfirmDelete(false);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onDelete?.(comment.id);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  // ---- Reply helpers -------------------------------------------------------

  function insertReplyEmoji(emoji: string) {
    const textarea = replyTextareaRef.current;
    if (!textarea) { setReplyBody((prev) => prev + emoji); return; }
    const start = textarea.selectionStart ?? replyBody.length;
    const end = textarea.selectionEnd ?? replyBody.length;
    const newBody = replyBody.substring(0, start) + emoji + replyBody.substring(end);
    setReplyBody(newBody);
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  }

  function handleReplyImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...replyImageFiles, ...files].slice(0, 10);
    setReplyImageFiles(combined);
    setReplyImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    if (replyImageRef.current) replyImageRef.current.value = "";
  }

  async function handleReplyVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (replyVideoRef.current) replyVideoRef.current.value = "";
    setReplyVideoError("");
    const sizeErr = validateVideoFile(file);
    if (sizeErr) { setReplyVideoError(sizeErr); return; }
    const durErr = await checkVideoDuration(file);
    if (durErr) { setReplyVideoError(durErr); return; }
    setReplyVideoFile(file);
    setReplyVideoPreview(URL.createObjectURL(file));
  }

  function handleReplyDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setReplyDocFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, file: f }))].slice(0, 5));
    if (replyDocRef.current) replyDocRef.current.value = "";
  }

  // ---- Reply ---------------------------------------------------------------

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    const hasContent = replyBody.trim() || replyImageFiles.length || replyVideoFile ||
      replyVideoEmbedUrl.trim() || replyDocFiles.length;
    if (!hasContent) return;
    setReplyLoading(true);
    setReplyError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      type AttItem = string | { url: string; name: string; size: number; mediaType?: string };
      let attachments: AttItem[] = [];

      if (replyImageFiles.length > 0) {
        setUploadingReplyImages(true);
        try {
          const compressed = await Promise.all(replyImageFiles.map((f) => compressImage(f, 1)));
          const uploaded = await uploadFiles(compressed, "posts");
          attachments = uploaded.map((f) => f.url);
        } catch {
          setReplyError("Erro ao enviar imagens. Tente novamente.");
          return;
        } finally {
          setUploadingReplyImages(false);
        }
      }

      if (replyVideoFile) {
        setUploadingReplyVideo(true);
        try {
          const uploaded = await uploadFiles([replyVideoFile], "posts");
          const v = uploaded[0];
          attachments = [...attachments, { url: v.url, name: v.name, size: v.size, mediaType: "video" }];
        } catch {
          setReplyError("Erro ao enviar vídeo. Tente novamente.");
          return;
        } finally {
          setUploadingReplyVideo(false);
        }
      }

      if (replyVideoEmbedUrl.trim()) {
        attachments = [...attachments, { url: replyVideoEmbedUrl.trim(), name: "video-embed", size: 0, mediaType: "video-embed" }];
      }

      if (replyDocFiles.length > 0) {
        setUploadingReplyDocs(true);
        try {
          const uploaded = await uploadFiles(replyDocFiles.map((d) => d.file), "posts");
          const withTypes = uploaded.map((f) => {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            return { url: f.url, name: f.name, size: f.size, mediaType: ext === "pdf" ? "pdf" : "doc" };
          });
          attachments = [...attachments, ...withTypes];
        } catch {
          setReplyError("Erro ao enviar arquivos. Tente novamente.");
          return;
        } finally {
          setUploadingReplyDocs(false);
        }
      }

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: replyBody.trim() || " ", parentId: comment.id, attachments }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setReplyError(json.error ?? "Erro ao responder.");
        return;
      }
      setLocalReplies((prev) => [...prev, json.data]);
      setReplyBody("");
      replyImagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setReplyImageFiles([]); setReplyImagePreviews([]);
      if (replyVideoPreview) URL.revokeObjectURL(replyVideoPreview);
      setReplyVideoFile(null); setReplyVideoPreview(""); setReplyVideoError("");
      setReplyVideoEmbedUrl(""); setReplyShowEmbed(false);
      setReplyDocFiles([]);
      setReplyShowLink(false); setReplyLinkVal("");
      setShowReplyBox(false);
    } catch {
      setReplyError("Erro de conexão.");
    } finally {
      setReplyLoading(false);
      setUploadingReply(false);
    }
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className={isReply ? "pl-4 border-l border-white/10" : ""}>
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.author.avatarUrl ? (
          <Image
            src={comment.author.avatarUrl}
            alt={authorName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#006079]/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-[#EEE6E4]">{authorName}</span>
            <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          </div>

          {/* Body */}
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
            {comment.body}
          </p>

          {/* Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {comment.attachments.map((att, i) => {
                if (typeof att === "string") {
                  // Detect image URLs by extension
                  const isImg = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i.test(att);
                  if (isImg) {
                    return (
                      <a key={i} href={att} target="_blank" rel="noopener noreferrer" className="block">
                        <Image src={att} alt="imagem" width={400} height={300}
                          className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity cursor-zoom-in object-cover max-h-60"
                        />
                      </a>
                    );
                  }
                  // Detect video
                  const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(att);
                  if (isVid) {
                    return (
                      /* eslint-disable-next-line jsx-a11y/media-has-caption */
                      <video key={i} src={att} controls className="max-w-full max-h-48 rounded-lg border border-white/10 bg-black" />
                    );
                  }
                  // Generic link
                  return (
                    <a key={i} href={att} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#009CD9]/40 rounded-lg px-3 py-2 text-xs text-[#009CD9] hover:text-[#EEE6E4] transition-all group">
                      <Download className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Visualizar arquivo</span>
                    </a>
                  );
                }

                // Object attachment
                const ext = att.name?.split(".").pop()?.toLowerCase() ?? "";
                const isImg = ["jpg","jpeg","png","gif","webp","avif"].includes(ext);
                const isVid = ["mp4","webm","mov"].includes(ext) || att.mediaType === "video";
                const isEmbed = att.mediaType === "video-embed";
                const isPdf = ext === "pdf" || att.mediaType === "pdf";

                if (isEmbed) {
                  // YouTube/Vimeo embed
                  const ytMatch = att.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                  const vimeoMatch = att.url.match(/vimeo\.com\/(\d+)/);
                  if (ytMatch) {
                    return (
                      <div key={i} className="aspect-video w-full rounded-lg overflow-hidden border border-white/10">
                        <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                      </div>
                    );
                  }
                  if (vimeoMatch) {
                    return (
                      <div key={i} className="aspect-video w-full rounded-lg overflow-hidden border border-white/10">
                        <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} allowFullScreen className="w-full h-full" />
                      </div>
                    );
                  }
                }
                if (isImg) {
                  return (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                      <Image src={att.url} alt={att.name ?? "imagem"} width={400} height={300}
                        className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity cursor-zoom-in object-cover max-h-60"
                      />
                    </a>
                  );
                }
                if (isVid) {
                  return (
                    /* eslint-disable-next-line jsx-a11y/media-has-caption */
                    <video key={i} src={att.url} controls className="max-w-full max-h-48 rounded-lg border border-white/10 bg-black" />
                  );
                }
                return (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#009CD9]/40 rounded-lg px-3 py-2 text-xs text-gray-300 hover:text-[#EEE6E4] transition-all group">
                    <FileText className={`w-4 h-4 flex-shrink-0 ${isPdf ? "text-red-400" : "text-[#009CD9]"}`} />
                    <span className="flex-1 min-w-0 truncate">{isPdf ? "Visualizar PDF" : att.name ?? "Visualizar arquivo"}</span>
                    {att.size != null && att.size > 0 && <span className="text-gray-500 flex-shrink-0">{Math.round(att.size / 1024)}KB</span>}
                    <Download className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#009CD9] flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={[
                "inline-flex items-center gap-1 text-xs transition-colors",
                liked
                  ? "text-[#009CD9] hover:text-[#009CD9]"
                  : "text-gray-500 hover:text-[#009CD9]",
              ].join(" ")}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setShowReplyBox((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#009CD9] transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Responder
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>

          {/* Reply box */}
          {showReplyBox && (
            <form onSubmit={handleReply} className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
              <textarea
                ref={replyTextareaRef}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Escreva uma resposta..."
                rows={2}
                className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-400 focus:outline-none resize-none"
              />

              {/* Image previews */}
              {replyImagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyImagePreviews.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <Image src={url} alt="" width={60} height={60}
                        unoptimized={replyImageFiles[idx]?.type === "image/gif"}
                        className="object-cover rounded-lg border border-white/10"
                        style={{ width: 60, height: 60 }}
                      />
                      <button type="button" onClick={() => {
                        URL.revokeObjectURL(url);
                        setReplyImageFiles((p) => p.filter((_, i) => i !== idx));
                        setReplyImagePreviews((p) => p.filter((_, i) => i !== idx));
                      }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      {replyImageFiles[idx]?.type === "image/gif" && (
                        <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-black/70 text-white rounded px-0.5">GIF</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Video preview */}
              {replyVideoPreview && (
                <div>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={replyVideoPreview} controls className="w-full max-h-32 rounded-lg border border-white/10 bg-black" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400 truncate">{replyVideoFile?.name}</span>
                    <button type="button" onClick={() => { URL.revokeObjectURL(replyVideoPreview); setReplyVideoFile(null); setReplyVideoPreview(""); setReplyVideoError(""); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-2 flex-shrink-0">
                      <X className="w-3 h-3" /> Remover
                    </button>
                  </div>
                </div>
              )}
              {replyVideoError && <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">{replyVideoError}</p>}

              {/* Embed URL input */}
              {replyShowEmbed && !replyVideoFile && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <Link2 className="w-3 h-3 text-[#009CD9] flex-shrink-0" />
                  <input type="url" value={replyVideoEmbedUrl} onChange={(e) => setReplyVideoEmbedUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
                  />
                  {replyVideoEmbedUrl.trim() && <span className="text-xs text-[#009CD9]">✓</span>}
                  <button type="button" onClick={() => { setReplyShowEmbed(false); setReplyVideoEmbedUrl(""); }} className="text-gray-500 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              )}

              {/* Doc previews */}
              {replyDocFiles.length > 0 && (
                <div className="flex flex-col gap-1">
                  {replyDocFiles.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                      <FileText className={`w-3 h-3 flex-shrink-0 ${doc.name.toLowerCase().endsWith(".pdf") ? "text-red-400" : "text-[#009CD9]"}`} />
                      <span className="flex-1 text-xs text-gray-300 truncate">{doc.name}</span>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{(doc.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => setReplyDocFiles((p) => p.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Link input */}
              {replyShowLink && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <Link2 className="w-3 h-3 text-[#009CD9] flex-shrink-0" />
                  <input type="url" value={replyLinkVal} onChange={(e) => setReplyLinkVal(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (replyLinkVal.trim()) { setReplyBody((prev) => prev + (prev ? "\n" : "") + replyLinkVal.trim()); setReplyLinkVal(""); setReplyShowLink(false); } } }}
                    className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => { if (replyLinkVal.trim()) setReplyBody((prev) => prev + (prev ? "\n" : "") + replyLinkVal.trim()); setReplyLinkVal(""); setReplyShowLink(false); }} className="text-xs text-[#009CD9] hover:text-[#007A99] font-medium transition-colors">Inserir</button>
                  <button type="button" onClick={() => { setReplyShowLink(false); setReplyLinkVal(""); }} className="text-gray-500 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              )}

              {replyError && <p className="text-xs text-red-400">{replyError}</p>}

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 border-t border-white/10 pt-2">

                {/* Emoji */}
                <div className="relative flex-shrink-0" ref={replyEmojiPickerRef}>
                  <button type="button" onClick={() => setReplyEmojiOpen((v) => !v)}
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded-lg transition-colors ${replyEmojiOpen ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                    title="Emoji">
                    <Smile className="w-3.5 h-3.5" /><span className="hidden sm:inline text-[11px]">Emoji</span>
                  </button>
                  {replyEmojiOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="flex border-b border-white/10">
                        {EMOJI_CATS.map((cat, i) => (
                          <button key={i} type="button" onClick={() => setReplyEmojiTab(i)} title={cat.title}
                            className={`flex-1 py-1.5 text-sm transition-colors hover:bg-white/5 ${replyEmojiTab === i ? "bg-white/10" : ""}`}>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-2">
                        <div className="grid grid-cols-8 gap-0.5 max-h-36 overflow-y-auto">
                          {EMOJI_CATS[replyEmojiTab].emojis.map((emoji, i) => (
                            <button key={i} type="button" onClick={() => insertReplyEmoji(emoji)}
                              className="w-7 h-7 flex items-center justify-center text-base hover:bg-white/10 rounded-lg transition-colors">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto/GIF */}
                <button type="button" onClick={() => replyImageRef.current?.click()}
                  disabled={replyImageFiles.length >= 10 || !!replyVideoFile}
                  className="inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
                  title="Foto ou GIF">
                  <ImageIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline text-[11px]">Foto/GIF</span>
                  {replyImageFiles.length > 0 && <span className="text-[#009CD9] text-[11px]">({replyImageFiles.length})</span>}
                </button>

                {/* Vídeo */}
                <div className="relative flex-shrink-0" ref={replyVideoMenuRef}>
                  <button type="button"
                    onClick={() => { if (!replyVideoFile && !replyVideoEmbedUrl && replyImageFiles.length === 0) setReplyVideoMenuOpen((v) => !v); }}
                    disabled={(!!replyVideoFile || !!replyVideoEmbedUrl) && !replyVideoMenuOpen}
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${(replyVideoFile || replyVideoEmbedUrl) ? "text-[#009CD9] bg-[#006079]/20" : replyVideoMenuOpen ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                    title="Vídeo">
                    <Video className="w-3.5 h-3.5" /><span className="hidden sm:inline text-[11px]">Vídeo</span>
                  </button>
                  {replyVideoMenuOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-44 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <button type="button" onClick={() => { replyVideoRef.current?.click(); setReplyVideoMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors">
                        <Paperclip className="w-3 h-3 text-[#009CD9]" />Upload<span className="ml-auto text-[10px] text-gray-500">MP4/WebM</span>
                      </button>
                      <button type="button" onClick={() => { setReplyShowEmbed(true); setReplyVideoMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors border-t border-white/5">
                        <Link2 className="w-3 h-3 text-[#009CD9]" />Embedar URL
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF */}
                <button type="button" onClick={() => replyDocRef.current?.click()}
                  disabled={replyDocFiles.length >= 5 || !!replyVideoFile}
                  className="inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
                  title="PDF ou arquivo">
                  <Paperclip className="w-3.5 h-3.5" /><span className="hidden sm:inline text-[11px]">PDF</span>
                  {replyDocFiles.length > 0 && <span className="text-[#009CD9] text-[11px]">({replyDocFiles.length})</span>}
                </button>

                {/* Link */}
                <button type="button" onClick={() => setReplyShowLink((v) => !v)}
                  className={`inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded-lg transition-colors flex-shrink-0 ${replyShowLink ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"}`}
                  title="Inserir link">
                  <Link2 className="w-3.5 h-3.5" /><span className="hidden sm:inline text-[11px]">Link</span>
                </button>

                <div className="flex-1" />

                <button type="submit"
                  disabled={replyLoading || uploadingReply || uploadingReplyImages || uploadingReplyVideo || uploadingReplyDocs ||
                    !(replyBody.trim() || replyImageFiles.length || replyVideoFile || replyVideoEmbedUrl.trim() || replyDocFiles.length)}
                  className="text-xs bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0">
                  {(uploadingReplyImages || uploadingReplyVideo || uploadingReplyDocs || uploadingReply) ? "Enviando..." : replyLoading ? "Publicando..." : "Responder"}
                </button>
                <button type="button"
                  onClick={() => { setShowReplyBox(false); setReplyBody(""); replyImagePreviews.forEach((u) => URL.revokeObjectURL(u)); setReplyImageFiles([]); setReplyImagePreviews([]); if (replyVideoPreview) URL.revokeObjectURL(replyVideoPreview); setReplyVideoFile(null); setReplyVideoPreview(""); setReplyDocFiles([]); }}
                  className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1.5 transition-colors flex-shrink-0">
                  Cancelar
                </button>
              </div>

              {/* Hidden inputs */}
              <input ref={replyImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleReplyImageSelect} />
              <input ref={replyVideoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleReplyVideoSelect} />
              <input ref={replyDocRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" multiple className="hidden" onChange={handleReplyDocSelect} />
            </form>
          )}

          {/* Replies */}
          {localReplies.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {localReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  onDelete={(id) =>
                    setLocalReplies((prev) => prev.filter((r) => r.id !== id))
                  }
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Excluir comentário"
        description="Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
