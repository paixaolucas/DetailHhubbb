"use client";

// =============================================================================
// CommentItem — displays a single comment with author, body, reactions,
// delete option, and inline reply form. Renders replies indented below.
// =============================================================================

import { useState, useRef } from "react";
import Image from "next/image";
import { ThumbsUp, Trash2, CornerDownRight, Paperclip, FileText, Download, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { STORAGE_KEYS } from "@/lib/constants";
import { uploadFiles } from "@/utils/upload";

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
  const [localReplies, setLocalReplies] = useState<CommentData[]>(
    comment.replies ?? []
  );
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [uploadingReply, setUploadingReply] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);

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

  // ---- Reply ---------------------------------------------------------------

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() && replyFiles.length === 0) return;
    setReplyLoading(true);
    setReplyError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      // Upload files first
      let attachments: (string | CommentAttachment)[] = [];
      if (replyFiles.length > 0) {
        setUploadingReply(true);
        try {
          const uploaded = await uploadFiles(replyFiles, "posts");
          attachments = uploaded;
        } catch {
          setReplyError("Erro ao enviar arquivo. Tente novamente.");
          return;
        } finally {
          setUploadingReply(false);
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
      setReplyFiles([]);
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
            <div className="mt-2 flex flex-col gap-1.5">
              {comment.attachments.map((att, i) => {
                if (typeof att === "string") {
                  return (
                    <a key={i} href={att} target="_blank" rel="noopener noreferrer" className="text-xs text-[#009CD9] hover:underline break-all">
                      {att}
                    </a>
                  );
                }
                return (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#009CD9]/40 rounded-lg px-3 py-2 text-xs text-gray-300 hover:text-[#EEE6E4] transition-all group"
                  >
                    <FileText className="w-4 h-4 text-[#009CD9] flex-shrink-0" />
                    <span className="flex-1 min-w-0 truncate">{att.name}</span>
                    {att.size && <span className="text-gray-500 flex-shrink-0">{Math.round(att.size / 1024)}KB</span>}
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
            <form onSubmit={handleReply} className="mt-3 flex flex-col gap-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Escreva uma resposta..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 focus:border-[#009CD9]/40 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 resize-none transition-all"
              />

              {/* File previews */}
              {replyFiles.length > 0 && (
                <div className="flex flex-col gap-1">
                  {replyFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                      <FileText className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-gray-500">{Math.round(f.size / 1024)}KB</span>
                      <button type="button" onClick={() => setReplyFiles((prev) => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {replyError && (
                <p className="text-xs text-red-400">{replyError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => replyFileRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#009CD9] transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={replyFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.gif,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setReplyFiles((prev) => [...prev, ...files].slice(0, 5));
                    e.target.value = "";
                  }}
                />
                <button
                  type="submit"
                  disabled={replyLoading || uploadingReply || (!replyBody.trim() && replyFiles.length === 0)}
                  className="text-xs bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  {uploadingReply ? "Enviando..." : replyLoading ? "Publicando..." : "Responder"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplyBox(false); setReplyBody(""); setReplyFiles([]); }}
                  className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1.5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
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
