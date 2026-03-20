// =============================================================================
// GET    /api/ai/analise/[id] — detalhes de uma análise
// DELETE /api/ai/analise/[id] — remove uma análise
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getAnalysis, deleteAnalysis } from "@/services/ai/analysis.service";
import type { AuthSession } from "@/types";

export const GET = withAuth(
  async (
    req: NextRequest,
    {
      session,
      params,
    }: { session: AuthSession; params?: Record<string, string> }
  ) => {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID necessário" },
        { status: 400 }
      );
    }

    const analysis = await getAnalysis(id, session.userId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: analysis });
  }
);

export const DELETE = withAuth(
  async (
    req: NextRequest,
    {
      session,
      params,
    }: { session: AuthSession; params?: Record<string, string> }
  ) => {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID necessário" },
        { status: 400 }
      );
    }

    const analysis = await getAnalysis(id, session.userId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Análise não encontrada" },
        { status: 404 }
      );
    }

    await deleteAnalysis(id, session.userId);
    return NextResponse.json({ success: true });
  }
);
