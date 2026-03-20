// =============================================================================
// POST /api/upload — upload de arquivo para Supabase Storage
// Requer autenticação. Aceita multipart/form-data: file + bucket.
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ALLOWED_BUCKETS = ["avatars", "community-images", "posts", "lessons", "analyses"] as const;

const MAX_SIZES: Record<string, number> = {
  "avatars": 4 * 1024 * 1024,           //   4MB
  "community-images": 8 * 1024 * 1024,  //   8MB
  "posts": 200 * 1024 * 1024,           // 200MB (images, videos, docs)
  "lessons": 200 * 1024 * 1024,         // 200MB
  "analyses": 200 * 1024 * 1024,        // 200MB (images, videos for AI analysis)
};

export const POST = withAuth(async (req, { session }) => {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: "Storage não configurado" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "posts";

    if (!file) {
      return NextResponse.json({ success: false, error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket as typeof ALLOWED_BUCKETS[number])) {
      return NextResponse.json({ success: false, error: "Bucket inválido" }, { status: 400 });
    }

    const maxSize = MAX_SIZES[bucket] ?? 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `Arquivo muito grande (máx ${maxSize / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Gera path único: userId/timestamp-filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${session.userId}/${Date.now()}-${safeName}`;
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";

    const doUpload = (ct: string) =>
      fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": ct,
          "x-upsert": "true",
        },
        body: fileBytes,
      });

    let uploadRes = await doUpload(contentType);

    // Se o bucket rejeitar o MIME type, tentar novamente como octet-stream
    if (!uploadRes.ok && uploadRes.status === 422 && contentType !== "application/octet-stream") {
      uploadRes = await doUpload("application/octet-stream");
    }

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[Upload] Supabase Storage error:", uploadRes.status, errText);
      let userMsg = "Falha no upload";
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error === "Bucket not found") userMsg = "Bucket de storage não encontrado. Configure os buckets no Supabase.";
        else if (errJson?.message) userMsg = errJson.message;
        else if (errJson?.error) userMsg = errJson.error;
      } catch { /* not json */ }
      return NextResponse.json({ success: false, error: userMsg }, { status: 500 });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, name: file.name, size: file.size },
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
});
