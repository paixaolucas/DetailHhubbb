// =============================================================================
// POST /api/ai/analise — cria e executa uma nova análise de IA
// GET  /api/ai/analise — lista análises do usuário autenticado
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyPlatformMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { runAnalysis, listAnalyses, fetchUrlMeta } from "@/services/ai/analysis.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/lib/constants";
import { UserRole } from "@prisma/client";
import type { AIAnalysisType, AIAnalysisInputType } from "@/types";
import type { AuthSession } from "@/types";

export const maxDuration = 60;

export const POST = withAuth(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    // Rate limit
    const limited = await checkRateLimit(
      `ai-analysis:${session.userId}`,
      RATE_LIMIT.AI_ANALYSIS.windowMs,
      RATE_LIMIT.AI_ANALYSIS.max
    );
    if (limited) return limited;

    // SUPER_ADMIN e INFLUENCER_ADMIN têm acesso sem precisar de PlatformMembership
    const isPrivilegedRole =
      session.role === UserRole.SUPER_ADMIN ||
      session.role === UserRole.INFLUENCER_ADMIN;

    if (!isPrivilegedRole) {
      const hasPlatform = await verifyPlatformMembership(session.userId, session.hasPlatform);
      if (!hasPlatform) {
        return NextResponse.json(
          {
            success: false,
            error: "Assinatura da plataforma necessária para usar IA de Análises.",
          },
          { status: 403 }
        );
      }
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type deve ser application/json" },
        { status: 400 }
      );
    }

    let type: AIAnalysisType;
    let inputType: AIAnalysisInputType;
    let inputUrl: string | undefined;
    let pastedContent: string | undefined;
    let platform: string | undefined;
    let imageBase64Frames: string[] | undefined;
    let fileUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    const body = await req.json();
    type = body.type;
    inputType = body.inputType ?? "url";
    inputUrl = body.inputUrl;
    pastedContent = body.pastedContent;
    platform = body.platform;
    imageBase64Frames = body.imageBase64Frames;
    fileUrl = body.fileUrl;
    thumbnailUrl = body.thumbnailUrl;

    if (
      !type ||
      !["AD_CREATIVE", "PROFILE_AUDIT", "POST_ANALYSIS", "SITE_ANALYSIS"].includes(type)
    ) {
      return NextResponse.json(
        { success: false, error: "Tipo de análise inválido" },
        { status: 400 }
      );
    }

    if (!inputType || !["image", "video", "url"].includes(inputType)) {
      return NextResponse.json(
        { success: false, error: "Tipo de entrada inválido" },
        { status: 400 }
      );
    }

    // For URL analyses, fetch og:image as thumbnail (lightweight — just a URL string)
    if (inputType === "url" && inputUrl && !thumbnailUrl) {
      try {
        const { ogImage } = await fetchUrlMeta(inputUrl);
        if (ogImage) thumbnailUrl = ogImage;
      } catch { /* thumbnail is optional */ }
    }

    // Create pending record
    const analysis = await db.aIAnalysis.create({
      data: {
        userId: session.userId,
        type,
        inputType,
        inputUrl: inputUrl ?? null,
        pastedContent: pastedContent ?? null,
        fileUrl: fileUrl ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        platform: platform ?? null,
        status: "PENDING",
      },
    });

    try {
      const result = await runAnalysis({
        analysisId: analysis.id,
        userId: session.userId,
        type,
        inputType,
        inputUrl,
        pastedContent,
        imageBase64Frames: imageBase64Frames ?? [],
        platform,
      });

      return NextResponse.json({ success: true, data: result });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro na análise";
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      );
    }
  }
);

export const GET = withAuth(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "10"))
    );
    const typeParam = searchParams.get("type") as AIAnalysisType | null;

    const { analyses, total } = await listAnalyses({
      userId: session.userId,
      page,
      pageSize,
      type: typeParam ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: analyses,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);
