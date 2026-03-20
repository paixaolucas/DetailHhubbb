// =============================================================================
// UPLOAD UTILITY — client-side helper para upload via /api/upload (Supabase)
// =============================================================================

import { STORAGE_KEYS } from "@/lib/constants";

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export type UploadBucket = "avatars" | "community-images" | "posts" | "lessons";

/**
 * Faz upload de múltiplos arquivos para o Supabase Storage via /api/upload.
 * Lança erro se algum arquivo falhar.
 */
export async function uploadFiles(
  files: File[],
  bucket: UploadBucket = "posts"
): Promise<UploadResult[]> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const results: UploadResult[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "Upload falhou");
    }

    results.push(json.data as UploadResult);
  }

  return results;
}
