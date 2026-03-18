"use client";

// =============================================================================
// PostComposer — textarea-based form to create a new post in a space
// Calls POST /api/spaces/${spaceId}/posts, fires onPost callback on success
// Supports text and image posts via UploadThing
// =============================================================================

import { useState, useRef } from "react";
import Image from "next/image";
import { Send, Plus, Minus, ImageIcon, X } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import { STORAGE_KEYS } from "@/lib/constants";

interface PostComposerProps {
  spaceId: string;
  onPost: (post: unknown) => void;
}

export default function PostComposer({ spaceId, onPost }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("postAttachmentUploader");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const combined = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(combined);
    const previews = combined.map((f) => URL.createObjectURL(f));
    setPreviewUrls(previews);
    // reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && selectedFiles.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      let attachments: string[] = [];

      // Upload images first
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

      const payload: Record<string, unknown> = {
        body: body.trim() || " ",
        type: attachments.length > 0 ? "IMAGE" : "TEXT",
      };
      if (showTitle && title.trim()) payload.title = title.trim();
      if (attachments.length > 0) payload.attachments = attachments;

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
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const busy = isLoading || uploading;

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

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Compartilhe algo com a comunidade..."
        rows={3}
        className="w-full bg-transparent text-gray-300 placeholder-gray-400 focus:outline-none resize-none text-sm leading-relaxed"
      />

      {/* Image previews */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
            disabled={selectedFiles.length >= 10}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#009CD9] transition-colors disabled:opacity-40"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Foto
            {selectedFiles.length > 0 && (
              <span className="text-[#009CD9]">({selectedFiles.length})</span>
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
        </div>

        <button
          type="submit"
          disabled={busy || (!body.trim() && selectedFiles.length === 0)}
          className="inline-flex items-center gap-2 bg-[#006079] hover:bg-[#007A99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          {busy ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {uploading ? "Enviando..." : "Publicando..."}
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
