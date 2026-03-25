"use client";

// =============================================================================
// PostComposer — cria posts com imagens (comprimidas), vídeo direto, GIF, PDF
// e emoji picker estilo Circle.
// =============================================================================

import { useState, useRef, useEffect } from "react";
import {
  Send, Plus, Minus, ImageIcon, X,
  Video, Paperclip, Smile, FileText, Link2,
} from "lucide-react";
import { uploadFiles } from "@/utils/upload";
import { STORAGE_KEYS } from "@/lib/constants";
import { compressImage, validateVideoFile, checkVideoDuration } from "@/lib/media-optimize";
import { EMOJI_CATS } from "@/lib/emoji-data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostComposerProps {
  spaceId: string;
  communityId: string;
  onPost: (post: unknown) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PostComposer({ spaceId, communityId, onPost }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  // Images / GIFs
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Video (direct upload)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Docs (PDF, DOC, XLS, ZIP)
  const [docFiles, setDocFiles] = useState<{ name: string; size: number; file: File }[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Video menu (arquivo vs embedar)
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");
  const videoMenuRef = useRef<HTMLDivElement>(null);

  // Link
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputVal, setLinkInputVal] = useState("");

  // User info
  const [userName, setUserName] = useState("");
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) ?? "";
    setUserName(name);
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? "";
      const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
      setInitials((first + last).toUpperCase() || "?");
    }
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showEmojiPicker]);

  // Close video menu on outside click
  useEffect(() => {
    if (!showVideoMenu) return;
    function handleOutside(e: MouseEvent) {
      if (videoMenuRef.current && !videoMenuRef.current.contains(e.target as Node)) {
        setShowVideoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showVideoMenu]);

  // ── Emoji insertion ───────────────────────────────────────────────────────

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) { setBody((prev) => prev + emoji); return; }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const newBody = body.substring(0, start) + emoji + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  }

  // ── File handlers ─────────────────────────────────────────────────────────

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(combined);
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoInputRef.current) videoInputRef.current.value = "";
    setVideoError("");
    const sizeErr = validateVideoFile(file);
    if (sizeErr) { setVideoError(sizeErr); return; }
    const durErr = await checkVideoDuration(file);
    if (durErr) { setVideoError(durErr); return; }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }

  function removeVideo() {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl("");
    setVideoError("");
  }

  function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setDocFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size, file: f }))].slice(0, 5));
    if (docInputRef.current) docInputRef.current.value = "";
  }

  function removeDoc(idx: number) {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !imageFiles.length && !videoFile && !docFiles.length) return;

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      type AttItem = string | { url: string; name: string; size: number; mediaType?: string };
      let attachments: AttItem[] = [];

      // Upload images (compress non-GIFs to max 1MB)
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        try {
          const compressed = await Promise.all(imageFiles.map((f) => compressImage(f, 1)));
          const uploaded = await uploadFiles(compressed, "posts");
          // Store images as plain URL strings (backward compat)
          attachments = uploaded.map((f) => f.url);
        } catch {
          setError("Erro ao fazer upload das imagens. Tente novamente.");
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Upload video
      if (videoFile) {
        setUploadingVideo(true);
        try {
          const uploaded = await uploadFiles([videoFile], "posts");
          const v = uploaded[0];
          attachments = [...attachments, { url: v.url, name: v.name, size: v.size, mediaType: "video" }];
        } catch {
          setError("Erro ao fazer upload do vídeo. Tente novamente.");
          return;
        } finally {
          setUploadingVideo(false);
        }
      }

      // Upload docs (PDFs and other)
      if (docFiles.length > 0) {
        setUploadingDocs(true);
        try {
          const uploaded = await uploadFiles(docFiles.map((d) => d.file), "posts");
          const withTypes = uploaded.map((f) => {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            return { url: f.url, name: f.name, size: f.size, mediaType: ext === "pdf" ? "pdf" : "doc" };
          });
          attachments = [...attachments, ...withTypes];
        } catch {
          setError("Erro ao fazer upload dos arquivos. Tente novamente.");
          return;
        } finally {
          setUploadingDocs(false);
        }
      }

      // Handle embed URL (YouTube/Vimeo)
      if (videoEmbedUrl.trim()) {
        attachments = [...attachments, { url: videoEmbedUrl.trim(), name: "video-embed", size: 0, mediaType: "video-embed" }];
      }

      const type = (videoFile || videoEmbedUrl) ? "VIDEO" : imageFiles.length > 0 || docFiles.length > 0 ? "IMAGE" : "TEXT";
      const payload: Record<string, unknown> = { body: body.trim() || " ", type };
      if (showTitle && title.trim()) payload.title = title.trim();
      if (attachments.length > 0) payload.attachments = attachments;

      const res = await fetch(`/api/spaces/${spaceId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error ?? "Erro ao publicar."); return; }

      onPost(json.data);
      setBody(""); setTitle(""); setShowTitle(false);
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setImageFiles([]); setImagePreviews([]);
      setDocFiles([]);
      setFocused(false);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(null); setVideoPreviewUrl(""); setVideoError("");
      setVideoEmbedUrl(""); setShowEmbedInput(false);
      setShowLinkInput(false); setLinkInputVal("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }



  const busy = isLoading || uploadingImages || uploadingVideo || uploadingDocs;
  const hasContent = !!(body.trim() || imageFiles.length || videoFile || docFiles.length || videoEmbedUrl.trim());
  const expanded = focused || body.length > 0 || !!imageFiles.length || !!docFiles.length || !!videoFile || !!videoEmbedUrl;

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      {/* Optional title */}
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

      {/* Avatar + textarea */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#006079] to-[#009CD9] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 select-none"
          title={userName || undefined}
        >
          {initials}
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Compartilhe algo com a comunidade..."
          rows={expanded ? 4 : 2}
          className="flex-1 bg-transparent text-gray-300 placeholder-gray-400 focus:outline-none resize-none text-sm leading-relaxed transition-all duration-200"
        />
      </div>

      {/* Image / GIF previews */}
      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-12">
          {imagePreviews.map((url, idx) => (
            <div key={idx} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-white/10"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {imageFiles[idx]?.type === "image/gif" && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/70 text-white rounded px-1">GIF</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video preview */}
      {videoPreviewUrl && (
        <div className="pl-12">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={videoPreviewUrl}
            controls
            preload="metadata"
            playsInline
            className="w-full max-h-48 rounded-lg border border-white/10 bg-black"
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-xs text-gray-400 truncate">
              {videoFile?.name} · {videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : 0}MB
            </span>
            <button
              type="button"
              onClick={removeVideo}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-2 flex-shrink-0 transition-colors"
            >
              <X className="w-3 h-3" /> Remover
            </button>
          </div>
        </div>
      )}

      {/* Video error */}
      {videoError && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {videoError}
        </p>
      )}

      {/* Embed URL input */}
      {showEmbedInput && !videoFile && (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <Link2 className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
          <input
            type="url"
            value={videoEmbedUrl}
            onChange={(e) => setVideoEmbedUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... ou Vimeo"
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
          />
          {videoEmbedUrl.trim() && <span className="text-xs text-[#009CD9]">✓</span>}
          <button
            type="button"
            onClick={() => { setShowEmbedInput(false); setVideoEmbedUrl(""); }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <Link2 className="w-3.5 h-3.5 text-[#009CD9] flex-shrink-0" />
          <input
            type="url"
            value={linkInputVal}
            onChange={(e) => setLinkInputVal(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (linkInputVal.trim()) {
                  setBody((prev) => prev + (prev ? "\n" : "") + linkInputVal.trim());
                  setLinkInputVal(""); setShowLinkInput(false);
                }
              }
            }}
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (linkInputVal.trim()) setBody((prev) => prev + (prev ? "\n" : "") + linkInputVal.trim());
              setLinkInputVal(""); setShowLinkInput(false);
            }}
            className="text-xs text-[#009CD9] hover:text-[#007A99] font-medium transition-colors"
          >
            Inserir
          </button>
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkInputVal(""); }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Doc previews */}
      {docFiles.length > 0 && (
        <div className="flex flex-col gap-1.5 pl-12">
          {docFiles.map((doc, idx) => {
            const isPDF = doc.name.toLowerCase().endsWith(".pdf");
            return (
              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isPDF ? "text-red-400" : "text-[#009CD9]"}`} />
                <span className="flex-1 text-xs text-gray-300 truncate">{doc.name}</span>
                <span className="text-xs text-gray-600 flex-shrink-0">{(doc.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => removeDoc(idx)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 border-t border-white/10 pt-3">
        <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">

          {/* Emoji picker */}
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors ${
                showEmojiPicker ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"
              }`}
              title="Emoji"
            >
              <Smile className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Emoji</span>
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Category tabs + close */}
                <div className="flex border-b border-white/10">
                  {EMOJI_CATS.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEmojiTab(i)}
                      title={cat.title}
                      className={`flex-1 py-2 text-base transition-colors hover:bg-white/5 ${emojiTab === i ? "bg-white/10" : ""}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="px-2.5 text-gray-500 hover:text-[#EEE6E4] hover:bg-white/5 transition-colors flex-shrink-0"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Emoji grid */}
                <div className="p-2">
                  <p className="text-[10px] text-gray-500 px-1 mb-1.5 font-medium uppercase tracking-wide">
                    {EMOJI_CATS[emojiTab].title}
                  </p>
                  <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
                    {EMOJI_CATS[emojiTab].emojis.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Foto / GIF */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageFiles.length >= 10 || !!videoFile}
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
            title="Foto ou GIF (máx 10, imagens comprimidas p/ 1MB)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Foto/GIF</span>
            {imageFiles.length > 0 && <span className="text-[#009CD9]">({imageFiles.length})</span>}
          </button>

          {/* Vídeo — dropdown: arquivo ou embedar */}
          <div className="relative flex-shrink-0" ref={videoMenuRef}>
            <button
              type="button"
              onClick={() => { if (!videoFile && !videoEmbedUrl && imageFiles.length === 0) setShowVideoMenu((v) => !v); }}
              disabled={(!!videoFile || !!videoEmbedUrl) && !showVideoMenu}
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                (videoFile || videoEmbedUrl) ? "text-[#009CD9] bg-[#006079]/20" : showVideoMenu ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"
              }`}
              title="Vídeo"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vídeo</span>
            </button>
            {showVideoMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { videoInputRef.current?.click(); setShowVideoMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#009CD9]" />
                  Upload arquivo
                  <span className="ml-auto text-[10px] text-gray-500">MP4/WebM/MOV</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEmbedInput(true); setShowVideoMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-[#EEE6E4] transition-colors border-t border-white/5"
                >
                  <Link2 className="w-3.5 h-3.5 text-[#009CD9]" />
                  Embedar URL
                  <span className="ml-auto text-[10px] text-gray-500">YouTube/Vimeo</span>
                </button>
              </div>
            )}
          </div>

          {/* PDF / Arquivo */}
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            disabled={docFiles.length >= 5 || !!videoFile}
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:text-[#009CD9] hover:bg-white/5 transition-colors disabled:opacity-40 flex-shrink-0"
            title="PDF ou arquivo (máx 5)"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
            {docFiles.length > 0 && <span className="text-[#009CD9]">({docFiles.length})</span>}
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={() => setShowLinkInput((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
              showLinkInput ? "bg-[#006079]/20 text-[#009CD9]" : "text-gray-500 hover:text-[#009CD9] hover:bg-white/5"
            }`}
            title="Inserir link"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Link</span>
          </button>

          {/* Título toggle */}
          <button
            type="button"
            onClick={() => { setShowTitle((v) => !v); if (showTitle) setTitle(""); }}
            className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:text-gray-400 hover:bg-white/5 transition-colors flex-shrink-0"
          >
            {showTitle ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            <span className="hidden sm:inline">{showTitle ? "Remover título" : "Título"}</span>
          </button>
        </div>

        {/* Publicar */}
        <button
          type="submit"
          disabled={busy || !hasContent}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all flex-shrink-0 ml-2"
        >
          {busy ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden sm:inline">
                {uploadingImages ? "Enviando fotos..." : uploadingVideo ? "Enviando vídeo..." : uploadingDocs ? "Enviando arquivo..." : "Publicando..."}
              </span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Publicar</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoSelect} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" multiple className="hidden" onChange={handleDocSelect} />
    </form>
  );
}
