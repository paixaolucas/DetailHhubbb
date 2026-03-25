// =============================================================================
// UPLOAD UTILITY — client-side helper para upload via /api/upload (Supabase)
// =============================================================================

import { STORAGE_KEYS } from "@/lib/constants";

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export type UploadBucket = "avatars" | "community-images" | "posts" | "lessons" | "analyses";

/**
 * Faz upload de múltiplos arquivos para o Supabase Storage via /api/upload.
 * Lança erro se algum arquivo falhar.
 */
export async function uploadFiles(
  files: File[],
  bucket: UploadBucket = "posts"
): Promise<UploadResult[]> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const uploadOne = async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    // Timeout maior para vídeos (5min), padrão 2min para outros
    const isVideo = file.type.startsWith("video/");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), isVideo ? 300_000 : 120_000);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Upload falhou");
      }
      return json.data as UploadResult;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Upload cancelado por timeout. Tente um arquivo menor.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  // Imagens em paralelo, vídeos/docs sequencialmente (evitar sobrecarga)
  if (bucket === "posts" && files.every((f) => f.type.startsWith("image/"))) {
    return Promise.all(files.map(uploadOne));
  }

  const results: UploadResult[] = [];
  for (const file of files) {
    results.push(await uploadOne(file));
  }
  return results;
}
