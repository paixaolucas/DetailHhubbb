// =============================================================================
// POST /api/ai/chat
// AI assistant endpoint
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { aiService } from "@/services/ai/ai.service";
import { AppError } from "@/types";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT } from "@/lib/constants";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(10000),
      })
    )
    .min(1)
    .max(20),
  communityId: z.string().cuid().optional(),
  sessionId: z.string().optional(),
});

export const POST = withAuth(async (req, { session }) => {
  const limited = await checkRateLimit(`ai-chat:${session.userId}`, RATE_LIMIT.AI_CHAT.windowMs, RATE_LIMIT.AI_CHAT.max);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { messages, communityId, sessionId } = chatSchema.parse(body);

    const result = await aiService.chatWithAI({
      userId: session.userId,
      communityId,
      messages,
      sessionId,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("[AI:chat]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
