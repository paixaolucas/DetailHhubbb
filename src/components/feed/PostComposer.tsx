"use client";

// =============================================================================
// PostComposer — textarea-based form to create a new post in a space
// Calls POST /api/spaces/${spaceId}/posts, fires onPost callback on success
// Supports text and image posts via UploadThing
// Shows a motivational card if user score < 70 pts
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import Image from "next/image";
import { Send, Plus, Minus, ImageIcon, X, Lock, Rocket, Video, Paperclip, FileText } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import { STORAGE_KEYS } from "@/lib/constants";
import { getMemberLevel, getMemberLevelColor, POST_THRESHOLD } from "@/lib/points";
import VideoEmbed from "@/components/ui/VideoEmbed";

interface PostComposerProps {
  spaceId: string;
  communityId: string;
  onPost: (post: unknown) => void;
  scoreTrigger?: number;
}

export default function PostComposer({ spaceId, communityId, onPost, scoreTrigger }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Non-image file attachments
  const [docFiles, setDocFiles] = useState<{ name: string; size: number; file: File }[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16" | "4:3">("16:9");

  const [userName, setUserName] = useState("");
  const [initials, setInitials] = useState("?");

  // Score gate
  const [userScore, setUserScore] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  // Poll score silently (called on mount and every 10s)
  const pollScore = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!token || !userId || !communityId) return;
    fetch(`/api/communities/${communityId}/leaderboard?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.data?.points === "number") {
          setUserScore(d.data.points);
        } else {
          setUserScore(0);
        }
      })
      .catch(() => setUserScore(0));
  }, [communityId]);

  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
    setUserName(name);
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? "";
      const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
      setInitials((first + last).toUpperCase() || "?");
    }

    // Initial fetch with loading indicator
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!token || !userId || !communityId) {
      setScoreLoading(false);
      return;
    }
    fetch(`/api/communities/${communityId}/leaderboard?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.data?.points === "number") {
          setUserScore(d.data.points);
        } else {
          setUserScore(0);
        }
      })
      .catch(() => setUserScore(0))
      .finally(() => setScoreLoading(false));
  }, [communityId]);

  // Re-poll score every 60s (instant refresh still happens on reactions/comments)
  useAutoRefresh(pollScore, 60_000);

  // Instant re-fetch when parent signals a reaction/comment was made
  useEffect(() => {
    if (scoreTrigger) pollScore();
  }, [scoreTrigger, pollScore]);

  const { startUpload } = useUploadThing("postAttachmentUploader");
  const { startUpload: startFileUpload } = useUploadThing("postFileUploader");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(combined);
    const previews = combined.map((f) => URL.createObjectURL(f));
    setPreviewUrls(previews);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newDocs = files.map((f) => ({ name: f.name, size: f.size, file: f }));
    setDocFiles((prev) => [...prev, ...newDocs].slice(0, 5));
    if (docInputRef.current) docInputRef.current.value = "";
  }

  function removeDoc(idx: number) {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && selectedFiles.length === 0 && !videoUrl.trim() && docFiles.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      let attachments: (string | { url: string; name: string; size: number })[] = [];

      if (selectedFiles.length > 0) {
        setUploading(true);
        try {
          const uploaded = await startUpload(selectedFiles);
          attachments = (uploaded ?? []).map((f) => f.url);
        } catch {
          setError("Erro ao fazer upload das imagens. Tente novamente.");
          return;
        } finally {
          setUploading(false);
        }
      }

      if (docFiles.length > 0) {
        setUploadingDocs(true);
        try {
          const uploaded = await startFileUpload(docFiles.map((d) => d.file));
          const fileObjs = (uploaded ?? []).map((f, i) => ({
            url: f.url,
            name: docFiles[i]?.name ?? f.url.split("/").pop() ?? "arquivo",
            size: docFiles[i]?.size ?? 0,
          }));
          attachments = [...attachments, ...fileObjs];
        } catch {
          setError("Erro ao fazer upload dos arquivos. Tente novamente.");
          return;
        } finally {
          setUploadingDocs(false);
        }
      }

      const payload: Record<string, unknown> = {
        body: body.trim() || " ",
        type: videoUrl.trim() ? "VIDEO" : (selectedFiles.length > 0 || docFiles.length > 0) ? "IMAGE" : "TEXT",
      };
      if (showTitle && title.trim()) payload.title = title.trim();
      if (attachments.length > 0) payload.attachments = attachments;
      if (videoUrl.trim()) {
        payload.videoUrl = videoUrl.trim();
        payload.videoAspect = videoAspect;
      }

      const res = await fetch(`/api/spaces/${spaceId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Erro ao publicar.");
        return;
      }

      onPost(json.data);
      setBody("");
      setTitle("");
      setShowTitle(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setDocFiles([]);
      setFocused(false);
      setVideoUrl("");
      setVideoAspect("16:9");
      setShowVideoInput(false);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  // Loading skeleton
  if (scoreLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-3 bg-white/10 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  // Motivational gate card
  if (userScore !== null && userScore < POST_THRESHOLD) {
    const pct = Math.min(100, Math.round((userScore / POST_THRESHOLD) * 100));
    const remaining = POST_THRESHOLD - userScore;
    const level = getMemberLevel(userScore);
    const levelColor = getMemberLevelColor(level);
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006079]/20 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-[#009CD9]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-[#EEE6E4] text-sm">Você está quase lá!</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${levelColor}`}>{level}</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">
              Engaje com o conteúdo da comunidade para desbloquear a criação de posts.
              Faltam <span className="text-[#009CD9] font-semibold">{remaining} pts</span> para <strong>Participante</strong>.
            </p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#006079] to-[#009CD9] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{userScore} pts</span>
              <span className="text-xs text-gray-500">{POST_THRESHOLD} pts</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#009CD9]">
              <Rocket className="w-3.5 h-3.5" />
              Comente, reaja e assista conteúdos para ganhar pontos!
            </div>
          </div>
        </div>
      </div>
    );
  }

  const busy = isLoading || uploading || uploadingDocs;
  const expanded = focused || body.length > 0 || selectedFiles.length > 0 || docFiles.length > 0 || showVideoInput;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
    >
      {showTitle && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          maxLength={200}
          className="w-full bg-white/5 border border-white/10 hover:border-[#006079]/40 focus:border-[#009CD9]/40 rounded-lg px-3 py-2 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 text-sm transition-all"
        />
      )}

      {/* Composer row: avatar + textarea */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 select-none"
          title={userName || undefined}
        >
          {initials}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Compartilhe algo com a comunidade..."
          rows={expanded ? 4 : 2}
          className="flex-1 bg-transparent text-gray-300 placeholder-gray-400 focus:outline-none resize-none text-sm leading-relaxed transition-all duration-200"
        />
      </div>

      {/* Video URL input */}
      {showVideoInput && (
        <div className="pl-12 flex flex-col gap-2">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Cole a URL do YouTube ou Vimeo..."
            className="w-full bg-white/5 border border-white/10 hover:border-[#006079]/40 focus:border-[#009CD9]/40 rounded-lg px-3 py-2 text-[#EEE6E4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#009CD9]/20 text-sm transition-all"
          />
          {/* Aspect ratio selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Proporção:</span>
            {(["16:9", "9:16", "4:3"] as const).map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => setVideoAspect(ar)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  videoAspect === ar
                    ? "bg-[#006079]/20 border-[#009CD9]/40 text-[#009CD9]"
                    : "border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
          {videoUrl.trim() && (
            <VideoEmbed url={videoUrl.trim()} aspectRatio={videoAspect} className="mt-1" />
          )}
        </div>
      )}

      {/* Image previews */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-12">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative group">
              <Image
                src={url}
                alt=""
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg border border-white/10"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-[#EEE6E4]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Doc file previews */}
      {docFiles.length > 0 && (
        <div className="flex flex-col gap-1.5 pl-12">
          {docFiles.map((doc, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <FileText className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
              <span className="flex-1 text-xs text-gray-300 truncate">{doc.name}</span>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {(doc.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => removeDoc(idx)}
                className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowTitle((v) => !v);
              if (showTitle) setTitle("");
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            {showTitle ? (
              <>
                <Minus className="w-3 h-3" /> Remover título
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> Título
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= 10 || showVideoInput}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#009CD9] transition-colors disabled:opacity-40"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Foto
            {selectedFiles.length > 0 && (
              <span className="text-[#009CD9]">({selectedFiles.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowVideoInput((v) => !v);
              if (showVideoInput) setVideoUrl("");
            }}
            disabled={selectedFiles.length > 0}
            className={`inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40 ${
              showVideoInput ? "text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9]"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Vídeo
          </button>

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            disabled={docFiles.length >= 5 || showVideoInput}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#009CD9] transition-colors disabled:opacity-40"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Arquivo
            {docFiles.length > 0 && (
              <span className="text-[#009CD9]">({docFiles.length})</span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
            multiple
            className="hidden"
            onChange={handleDocSelect}
          />
        </div>

        <button
          type="submit"
          disabled={busy || (!body.trim() && selectedFiles.length === 0 && !videoUrl.trim() && docFiles.length === 0)}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          {busy ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {uploading || uploadingDocs ? "Enviando..." : "Publicando..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publicar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
