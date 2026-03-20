import OpenAI from "openai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { db } from "@/lib/db";
import type {
  AIAnalysisType,
  AIAnalysisInputType,
  AIAnalysisDetail,
  AIAnalysisResult,
  AIAnalysisSummary,
  AIAnalysisStatus,
} from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =============================================================================
// URL FETCHER — extrai conteúdo + og:image da página
// =============================================================================

export async function fetchUrlMeta(url: string): Promise<{ content: string; ogImage: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { content: "", ogImage: null };

    const html = await res.text();

    // Extract og:image (lightweight thumbnail — just a URL string)
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const ogImage = ogImageMatch ? ogImageMatch[1].trim() : null;

    // Check if SPA (mostly JS) — still return ogImage even for SPAs
    const scriptCount = (html.match(/<script/gi) ?? []).length;
    const htmlLen = html.length;
    if (scriptCount > 20 && htmlLen < 50000) {
      // Likely SPA — extract only meta tags, no body text
      const metaContent = extractMetaOnly(html);
      return { content: metaContent, ogImage };
    }

    const extracted: string[] = [];

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) extracted.push(`TÍTULO: ${titleMatch[1].trim()}`);

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i);
    if (descMatch) extracted.push(`DESCRIÇÃO META: ${descMatch[1].trim()}`);

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    if (ogSite) extracted.push(`PLATAFORMA: ${ogSite[1].trim()}`);
    if (ogTitle) extracted.push(`OG TÍTULO: ${ogTitle[1].trim()}`);
    if (ogDesc) extracted.push(`OG DESCRIÇÃO: ${ogDesc[1].trim()}`);

    // Headings
    const h1Raw: string[] = [];
    let m: RegExpExecArray | null;
    const h1re = /<h1[^>]*>([^<]+)<\/h1>/gi;
    while ((m = h1re.exec(html)) !== null) h1Raw.push(m[1].replace(/<[^>]+>/g, "").trim());
    const h2Raw: string[] = [];
    const h2re = /<h2[^>]*>([^<]+)<\/h2>/gi;
    while ((m = h2re.exec(html)) !== null && h2Raw.length < 6) h2Raw.push(m[1].replace(/<[^>]+>/g, "").trim());
    if (h1Raw.length > 0) extracted.push(`H1: ${h1Raw.join(" | ")}`);
    if (h2Raw.length > 0) extracted.push(`H2: ${h2Raw.join(" | ")}`);

    // Visible body text
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);
    if (bodyText.length > 200) extracted.push(`\nCONTEÚDO DA PÁGINA:\n${bodyText}`);

    return { content: extracted.join("\n"), ogImage };
  } catch {
    return { content: "", ogImage: null };
  }
}

function extractMetaOnly(html: string): string {
  const parts: string[] = [];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) parts.push(`TÍTULO: ${title[1].trim()}`);
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (ogSite) parts.push(`PLATAFORMA: ${ogSite[1].trim()}`);
  if (ogTitle) parts.push(`TÍTULO: ${ogTitle[1].trim()}`);
  if (ogDesc) parts.push(`DESCRIÇÃO: ${ogDesc[1].trim()}`);
  return parts.join("\n");
}

// =============================================================================
// JSON EXTRACTOR — para Responses API (sem response_format)
// =============================================================================

function extractJson(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* */ }
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch { /* */ } }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* */ }
  }
  return null;
}

// =============================================================================
// PROMPTS
// =============================================================================

const AD_CREATIVE_PROMPT = `Você é o diretor criativo mais exigente da publicidade digital brasileira. Analise o criativo de anúncio fornecido com precisão cirúrgica.

CRITÉRIOS DE AVALIAÇÃO:
- Hook (0-100): Os primeiros 3 segundos/o elemento visual principal prendem imediatamente? Existe curiosidade, choque ou identificação?
- Clareza (0-100): A mensagem é entendida em <5 segundos? A oferta está clara? O público sabe o que é vendido?
- CTA (0-100): Existe call-to-action visível, urgente e específico?
- Ritmo (0-100): O ritmo/pacing mantém o interesse? Montagem, fala e transições prendem o espectador?
- Valor (0-100): A proposta de valor é clara e convincente? Benefícios > features?
- Impacto Emocional (0-100): Evoca emoção? Identificação, desejo, medo ou ganância?
- Design (0-100): Qualidade visual profissional? Hierarquia visual clara? Texto legível?
- Fit de Audiência (0-100): Linguagem, referências e tom adequados ao público-alvo?

CRITÉRIOS PARA DECISÃO:
- SCALE: score ≥ 75 e sem falhas críticas em Hook, Clareza ou CTA
- ITERATE: score 50-74 ou falhas corrigíveis
- KILL: score < 50 ou falhas estruturais simultâneas em Hook + Clareza + CTA

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100>,
  "creative_readiness": {
    "action": "<SCALE|ITERATE|KILL>",
    "reasoning": "<2-3 frases diretas e práticas>"
  },
  "breakdown": {
    "hook": <0-100>,
    "clareza": <0-100>,
    "cta": <0-100>,
    "ritmo": <0-100>,
    "valor": <0-100>,
    "impacto_emocional": <0-100>,
    "design": <0-100>,
    "fit_audiencia": <0-100>
  },
  "strengths": ["<específico 1>", "<específico 2>", "<específico 3>"],
  "weaknesses": ["<problema com impacto 1>", "<problema 2>", "<problema 3>"],
  "improvements": ["<acionável 1>", "<acionável 2>", "<acionável 3>"],
  "recommended_actions": ["<ação imediata 1>", "<ação 2>", "<ação 3>"]
}`;

const PROFILE_AUDIT_PROMPT = `Você é um especialista em marketing digital e growth para redes sociais com foco em conversão de perfil para audiência e negócios.

Analise o conteúdo do perfil fornecido abaixo. Se o conteúdo for limitado (perfil privado ou SPA), faça a melhor análise possível com o que está disponível — NUNCA retorne score 0 nem diga que não conseguiu acessar.

CRITÉRIOS DE AVALIAÇÃO:
1. CLAREZA DE IDENTIDADE: O visitante entende em 5 segundos quem é o perfil e o que oferece?
2. PROPOSTA DE VALOR: Existe diferencial claro? Por que seguir este e não outro?
3. BIO/DESCRIÇÃO: Específica, palavras-chave relevantes, CTA presente?
4. CREDIBILIDADE: Sinais de autoridade? (verificação, números, prêmios, mídia)
5. CALL-TO-ACTION: Link ou ação clara para o próximo passo?
6. CONSISTÊNCIA DE NICHO: Perfil focado ou disperso?
7. NOME/HANDLE: Memorável, fácil de pronunciar e encontrar?
8. APELO COMERCIAL: Atrai marcas, clientes ou parcerias?

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100 — NUNCA 0 a menos que o perfil seja completamente vazio>,
  "summary": "<resumo executivo de 2-3 frases sobre o perfil baseado no conteúdo disponível>",
  "strengths": ["<ponto forte específico 1>", "<2>", "<3>"],
  "weaknesses": ["<problema que impacta crescimento 1>", "<2>", "<3>"],
  "improvements": ["<melhoria acionável com exemplo 1>", "<2>", "<3>"],
  "recommended_actions": ["<ação prioritária com instrução clara 1>", "<2>", "<3>"]
}`;

const POST_ANALYSIS_PROMPT = `Você é um especialista em crescimento orgânico, algoritmos de redes sociais e copywriting para conteúdo digital.

Analise o conteúdo fornecido abaixo. Se o conteúdo for limitado, faça a melhor análise possível — NUNCA retorne score 0 nem diga que não conseguiu acessar o post.

CRITÉRIOS DE AVALIAÇÃO:
1. HOOK (primeiros 3 segundos): Para vídeos — o início prende? Para posts — a primeira linha/visual é impactante?
2. RETENÇÃO: O conteúdo mantém interesse do início ao fim?
3. VALOR ENTREGUE: Ensina, entretém ou inspira de forma clara?
4. CTA E ENGAJAMENTO: Estimula comentários, compartilhamentos, salvamentos?
5. LEGENDA/COPY: A legenda complementa o visual? É conversacional?
6. HASHTAGS E KEYWORDS: Estratégia de alcance otimizada?
7. FORMATO E PLATAFORMA: Formato adequado para a plataforma?
8. TENDÊNCIAS: Aproveita formatos ou tendências atuais?

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100 — NUNCA 0 a menos que o conteúdo seja completamente vazio>,
  "summary": "<diagnóstico direto do potencial do conteúdo em 2-3 frases>",
  "strengths": ["<ponto forte 1>", "<2>", "<3>"],
  "weaknesses": ["<problema que limita alcance 1>", "<2>", "<3>"],
  "improvements": ["<melhoria com exemplo de como aplicar 1>", "<2>", "<3>"],
  "recommended_actions": ["<ação de maior impacto 1>", "<2>", "<3>"]
}`;

const SITE_ANALYSIS_PROMPT = `Você é um especialista sênior em CRO (Conversion Rate Optimization), UX, copywriting persuasivo e performance de landing pages.

Analise o conteúdo do site fornecido abaixo. Se o conteúdo for limitado, faça a melhor análise possível com o que está disponível — NUNCA retorne score 0 nem diga que não conseguiu acessar o site.

DIMENSÕES DE ANÁLISE:
1. HEADLINE E SUB-HEADLINE: Comunica o benefício em <5s? É específica? Usa dados?
2. PROPOSTA DE VALOR ÚNICA (UVP): Diferencial competitivo explícito? Benefício acima do fold?
3. PROVA SOCIAL: Depoimentos, números, logos, garantias?
4. CALL-TO-ACTION: CTA visível sem scroll? Copy específico? Contraste adequado?
5. FLUXO NARRATIVO (AIDA/PAS): Estrutura guia à conversão? Objeções tratadas?
6. COPYWRITING E PERSUASÃO: Linguagem fala com dores? Benefícios > features?
7. DESIGN E USABILIDADE: Hierarquia visual correta? Legibilidade? Aparência profissional?
8. FORMULÁRIOS E ATRITO: Mínimo de campos? Processo simples?
9. MOBILE E PERFORMANCE: Experiência mobile-first?
10. SEO ON-PAGE: Meta title/description otimizados? H1/H2 coerentes?

Score: 0-30 fraca | 31-60 mediana | 61-80 boa | 81-100 excelente
Seja específico — cite exemplos reais do conteúdo fornecido.

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100 — NUNCA 0 a menos que o site seja completamente vazio>,
  "summary": "<diagnóstico executivo com 2-3 achados mais críticos para conversão>",
  "strengths": ["<ponto forte específico 1>", "<2>", "<3>"],
  "weaknesses": ["<problema crítico com impacto na conversão 1>", "<2>", "<3>"],
  "improvements": ["<melhoria com exemplo de implementação 1>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<Quick Win de maior impacto 1>", "<2>", "<3>", "<4>"]
}`;

// =============================================================================
// MAIN ANALYSIS RUNNER
// URL/text → Chat Completions + response_format (garante JSON)
// Image/video → Responses API (vision)
// =============================================================================

export async function runAnalysis(params: {
  analysisId: string;
  userId: string;
  type: AIAnalysisType;
  inputType: AIAnalysisInputType;
  inputUrl?: string;
  pastedContent?: string;
  imageBase64Frames?: string[];
  platform?: string;
}): Promise<AIAnalysisDetail> {
  const { analysisId, type, inputType, inputUrl, pastedContent, imageBase64Frames = [], platform } = params;

  const prompts: Record<AIAnalysisType, string> = {
    AD_CREATIVE: AD_CREATIVE_PROMPT,
    PROFILE_AUDIT: PROFILE_AUDIT_PROMPT,
    POST_ANALYSIS: POST_ANALYSIS_PROMPT,
    SITE_ANALYSIS: SITE_ANALYSIS_PROMPT,
  };
  const systemPrompt = prompts[type];

  try {
    let tokensUsed = 0;
    let rawJson: unknown = null;

    if (inputType === "image" || inputType === "video") {
      // ── Vision: Responses API ──────────────────────────────────────────────
      if (imageBase64Frames.length === 0) {
        throw new Error("Nenhum frame de imagem/vídeo foi enviado para análise.");
      }

      type ContentPart = { type: "input_text"; text: string } | { type: "input_image"; image_url: string };
      const parts: ContentPart[] = imageBase64Frames.map((b64) => ({
        type: "input_image" as const,
        image_url: b64,
      }));
      const ctx: string[] = [];
      if (platform) ctx.push(`Plataforma: ${platform}`);
      if (pastedContent) ctx.push(`Contexto: ${pastedContent}`);
      ctx.push("Retorne APENAS o JSON solicitado, sem texto adicional.");
      parts.push({ type: "input_text" as const, text: ctx.join("\n") });

      const res = (await openai.responses.create({
        model: "gpt-4o",
        instructions: systemPrompt,
        input: [{ role: "user" as const, content: parts as unknown as string }],
        temperature: 0.3,
        max_output_tokens: 3000,
      })) as OpenAIResponse;

      tokensUsed = res.usage?.total_tokens ?? 0;
      rawJson = extractJson(res.output_text ?? "");

    } else {
      // ── URL/text: Chat Completions + response_format (always valid JSON) ──
      const lines: string[] = [];

      if (inputUrl) {
        lines.push(`URL ANALISADA: ${inputUrl}`);
        if (platform) lines.push(`Plataforma: ${platform}`);

        const { content } = await fetchUrlMeta(inputUrl);
        if (content) {
          lines.push("\n--- CONTEÚDO EXTRAÍDO DA PÁGINA ---");
          lines.push(content);
          lines.push("--- FIM ---");
        } else {
          lines.push("\n[Conteúdo da página não disponível via fetch — analise com base na URL e no contexto fornecido]");
        }
      }

      if (pastedContent) {
        lines.push("\n--- INFORMAÇÕES ADICIONAIS DO USUÁRIO ---");
        lines.push(pastedContent);
      }

      if (lines.length === 0) {
        throw new Error("Nenhum conteúdo foi fornecido para análise.");
      }

      const res = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: lines.join("\n") },
        ],
      });

      tokensUsed = res.usage?.total_tokens ?? 0;
      rawJson = extractJson(res.choices[0]?.message?.content ?? "{}");
    }

    // ── Parse result ──────────────────────────────────────────────────────────
    let parsed: AIAnalysisResult;
    if (rawJson && typeof rawJson === "object") {
      const r = rawJson as Record<string, unknown>;
      let creative_readiness: "SCALE" | "ITERATE" | "KILL" | undefined;
      let creative_readiness_reasoning: string | undefined;
      if (r.creative_readiness && typeof r.creative_readiness === "object") {
        const cr = r.creative_readiness as Record<string, unknown>;
        creative_readiness = cr.action as "SCALE" | "ITERATE" | "KILL";
        creative_readiness_reasoning = cr.reasoning as string;
      } else if (typeof r.creative_readiness === "string") {
        creative_readiness = r.creative_readiness as "SCALE" | "ITERATE" | "KILL";
        creative_readiness_reasoning = r.creative_readiness_reasoning as string;
      }
      parsed = {
        score: Number(r.score ?? 50),
        summary: r.summary as string | undefined,
        creative_readiness,
        creative_readiness_reasoning,
        breakdown: r.breakdown as Record<string, number> | undefined,
        strengths: Array.isArray(r.strengths) ? (r.strengths as string[]) : [],
        weaknesses: Array.isArray(r.weaknesses) ? (r.weaknesses as string[]) : [],
        improvements: Array.isArray(r.improvements) ? (r.improvements as string[]) : [],
        recommended_actions: Array.isArray(r.recommended_actions) ? (r.recommended_actions as string[]) : [],
      };
    } else {
      parsed = {
        score: 50,
        summary: "Análise realizada — veja os detalhes abaixo.",
        strengths: [],
        weaknesses: [],
        improvements: [],
        recommended_actions: [],
      };
    }

    const updated = await db.aIAnalysis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETED",
        score: parsed.score,
        result: JSON.parse(JSON.stringify(parsed)),
        tokensUsed,
      },
    });

    return {
      id: updated.id,
      type: updated.type as AIAnalysisType,
      inputType: updated.inputType as AIAnalysisInputType,
      inputUrl: updated.inputUrl,
      fileUrl: updated.fileUrl,
      thumbnailUrl: updated.thumbnailUrl,
      platform: updated.platform,
      score: updated.score,
      status: updated.status as "COMPLETED",
      error: updated.error,
      createdAt: updated.createdAt.toISOString(),
      result: parsed,
      tokensUsed: updated.tokensUsed,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    await db.aIAnalysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", error: errorMsg },
    });
    throw err;
  }
}

// =============================================================================
// CRUD HELPERS
// =============================================================================

export async function listAnalyses(params: {
  userId: string;
  page: number;
  pageSize: number;
  type?: AIAnalysisType;
}): Promise<{ analyses: AIAnalysisSummary[]; total: number }> {
  const { userId, page, pageSize, type } = params;
  const skip = (page - 1) * pageSize;
  const where = { userId, ...(type ? { type } : {}) };
  const [analyses, total] = await db.$transaction([
    db.aIAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: { id: true, type: true, inputType: true, inputUrl: true, fileUrl: true, thumbnailUrl: true, platform: true, score: true, status: true, error: true, createdAt: true },
    }),
    db.aIAnalysis.count({ where }),
  ]);
  return {
    analyses: analyses.map((a) => ({
      ...a,
      type: a.type as AIAnalysisType,
      inputType: a.inputType as AIAnalysisInputType,
      status: a.status as AIAnalysisStatus,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
  };
}

export async function getAnalysis(id: string, userId: string): Promise<AIAnalysisDetail | null> {
  const a = await db.aIAnalysis.findFirst({ where: { id, userId } });
  if (!a) return null;
  return {
    id: a.id,
    type: a.type as AIAnalysisType,
    inputType: a.inputType as AIAnalysisInputType,
    inputUrl: a.inputUrl,
    fileUrl: a.fileUrl,
    thumbnailUrl: a.thumbnailUrl,
    platform: a.platform,
    score: a.score,
    status: a.status as AIAnalysisStatus,
    error: a.error,
    createdAt: a.createdAt.toISOString(),
    result: (a.result as AIAnalysisResult | null) ?? null,
    tokensUsed: a.tokensUsed,
  };
}

export async function deleteAnalysis(id: string, userId: string): Promise<void> {
  await db.aIAnalysis.deleteMany({ where: { id, userId } });
}
