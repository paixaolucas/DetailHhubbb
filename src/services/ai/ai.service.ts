// =============================================================================
// AI ASSISTANT SERVICE
// OpenAI chat with community context + usage logging
// =============================================================================

import OpenAI from "openai";
import { db } from "@/lib/db";
import { AppError } from "@/types";
import type { AIChatMessage, AIChatResponse } from "@/types";
import crypto from "crypto";

function uuidv4(): string {
  return crypto.randomUUID();
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new AppError("AI service not configured", 503, "AI_NOT_CONFIGURED");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4-turbo-preview";
const MAX_TOKENS = 2048;
const MAX_HISTORY_MESSAGES = 10;

// =============================================================================
// BUILD SYSTEM PROMPT
// Context-aware per community
// =============================================================================

async function buildSystemPrompt(communityId?: string): Promise<string> {
  const platformName = process.env.PLATFORM_NAME ?? "Comunidade Hub";

  let communityContext = "";

  if (communityId) {
    const community = await db.community.findUnique({
      where: { id: communityId },
      select: {
        name: true,
        description: true,
        rules: true,
        influencer: {
          select: { displayName: true },
        },
      },
    });

    if (community) {
      communityContext = `
You are the AI assistant for the "${community.name}" community, led by ${community.influencer.displayName}.

Community Description: ${community.description ?? "A vibrant learning community."}

Community Rules: ${community.rules ?? "Be respectful and supportive."}

Stay focused on topics relevant to this community and its members.`;
    }
  }

  return `You are an intelligent, helpful assistant for ${platformName}, a multi-community digital learning platform.
${communityContext}

Your responsibilities:
- Help members navigate the platform and find content
- Answer questions about community topics and subjects
- Provide guidance on using platform features
- Suggest relevant content and resources
- Support learning journeys with personalized advice

Guidelines:
- Be concise but thorough
- Always be respectful and professional
- If you don't know something, say so clearly
- Do not provide medical, legal, or financial advice
- Keep responses focused and actionable
- Use markdown formatting where helpful

Current date: ${new Date().toLocaleDateString("pt-BR")}`;
}

// =============================================================================
// CHAT WITH AI
// =============================================================================

export async function chatWithAI(params: {
  userId: string;
  communityId?: string;
  messages: AIChatMessage[];
  sessionId?: string;
}): Promise<AIChatResponse> {
  const openai = getOpenAIClient();
  const sessionId = params.sessionId ?? crypto.randomUUID();

  // Enforce message history limit to control token usage
  const recentMessages = params.messages.slice(-MAX_HISTORY_MESSAGES);

  const systemPrompt = await buildSystemPrompt(params.communityId);

  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
    stream: false,
  });

  const latencyMs = Date.now() - startTime;
  const usage = completion.usage;
  const assistantMessage = completion.choices[0]?.message?.content ?? "";

  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? 0;

  // Cost estimation (GPT-4 Turbo pricing as of 2024)
  const costPer1kPrompt = 0.01;
  const costPer1kCompletion = 0.03;
  const costUsd =
    (promptTokens / 1000) * costPer1kPrompt +
    (completionTokens / 1000) * costPer1kCompletion;

  // Log user message
  await db.aIUsageLog.create({
    data: {
      userId: params.userId,
      communityId: params.communityId,
      sessionId,
      role: "USER",
      content: recentMessages[recentMessages.length - 1]?.content ?? "",
      tokensUsed: promptTokens,
      model: MODEL,
      promptTokens,
      completionTokens: 0,
      costUsd: (promptTokens / 1000) * costPer1kPrompt,
      latencyMs,
    },
  });

  // Log assistant response
  await db.aIUsageLog.create({
    data: {
      userId: params.userId,
      communityId: params.communityId,
      sessionId,
      role: "ASSISTANT",
      content: assistantMessage,
      tokensUsed: completionTokens,
      model: MODEL,
      promptTokens,
      completionTokens,
      costUsd: parseFloat(costUsd.toFixed(6)),
      latencyMs,
    },
  });

  return {
    message: assistantMessage,
    tokensUsed: totalTokens,
    sessionId,
    costUsd: parseFloat(costUsd.toFixed(6)),
  };
}

// =============================================================================
// GET CHAT HISTORY
// =============================================================================

export async function getChatHistory(
  userId: string,
  sessionId: string
): Promise<AIChatMessage[]> {
  const logs = await db.aIUsageLog.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  return logs.map((l) => ({
    role: l.role.toLowerCase() as "user" | "assistant",
    content: l.content,
  }));
}

// =============================================================================
// USER USAGE STATS
// =============================================================================

export async function getAIUsageStats(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalTokens, totalCost, sessionCount] = await db.$transaction([
    db.aIUsageLog.aggregate({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { tokensUsed: true },
    }),
    db.aIUsageLog.aggregate({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { costUsd: true },
    }),
    db.aIUsageLog.groupBy({
      by: ["sessionId"],
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { sessionId: "asc" },
    }),
  ]);

  return {
    tokensUsed: totalTokens._sum.tokensUsed ?? 0,
    costUsd: Number(totalCost._sum.costUsd ?? 0),
    sessions: sessionCount.length,
    period: "30d",
  };
}

export const aiService = {
  chatWithAI,
  getChatHistory,
  getAIUsageStats,
};
