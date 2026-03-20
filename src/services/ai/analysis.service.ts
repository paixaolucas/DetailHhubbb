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
// URL FETCHER — extrai conteúdo + og:image
// =============================================================================

export async function fetchUrlMeta(url: string): Promise<{ content: string; ogImage: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
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

    // og:image — make absolute if relative
    const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    let ogImage: string | null = ogImgMatch ? ogImgMatch[1].trim() : null;
    if (ogImage && ogImage.startsWith("/")) {
      try { ogImage = new URL(ogImage, url).href; } catch { ogImage = null; }
    }

    const extracted: string[] = [];
    const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleM) extracted.push(`TÍTULO: ${titleM[1].trim()}`);

    const descM = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i);
    if (descM) extracted.push(`DESCRIÇÃO: ${descM[1].trim()}`);

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    if (ogSite) extracted.push(`PLATAFORMA: ${ogSite[1].trim()}`);
    if (ogTitle) extracted.push(`OG TÍTULO: ${ogTitle[1].trim()}`);
    if (ogDesc) extracted.push(`OG DESCRIÇÃO: ${ogDesc[1].trim()}`);

    const h1Raw: string[] = [];
    let m: RegExpExecArray | null;
    const h1re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    while ((m = h1re.exec(html)) !== null) h1Raw.push(m[1].replace(/<[^>]+>/g, "").trim());
    const h2Raw: string[] = [];
    const h2re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    while ((m = h2re.exec(html)) !== null && h2Raw.length < 5) h2Raw.push(m[1].replace(/<[^>]+>/g, "").trim());
    if (h1Raw.length > 0) extracted.push(`H1: ${h1Raw.join(" | ")}`);
    if (h2Raw.length > 0) extracted.push(`H2: ${h2Raw.join(" | ")}`);

    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);
    if (bodyText.length > 200) extracted.push(`\nCONTEÚDO:\n${bodyText}`);

    return { content: extracted.join("\n"), ogImage };
  } catch {
    return { content: "", ogImage: null };
  }
}

// =============================================================================
// STEP 1 — web_search: busca conteúdo real da URL/perfil/post/site
// Usado quando o fetch server-side retornar pouco conteúdo (SPAs, redes sociais)
// =============================================================================

async function searchUrlContent(url: string, type: AIAnalysisType, platform?: string): Promise<string> {
  // Build a smart search query based on URL and type
  let searchQuery = url;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;

    if (hostname.includes("instagram.com")) {
      const user = path.replace(/\//g, "").split("?")[0];
      searchQuery = `instagram perfil @${user} bio nicho seguidores conteúdo`;
    } else if (hostname.includes("tiktok.com")) {
      const user = path.replace(/\//g, "").replace("@", "").split("?")[0];
      searchQuery = `tiktok @${user} perfil bio nicho conteúdo seguidores`;
    } else if (hostname.includes("youtube.com")) {
      searchQuery = `youtube canal ${path} sobre nicho conteúdo`;
    } else if (type === "POST_ANALYSIS") {
      searchQuery = `conteúdo post ${url}`;
    } else if (type === "PROFILE_AUDIT") {
      searchQuery = `perfil ${hostname} ${path} sobre bio`;
    } else {
      // Site analysis
      searchQuery = `${hostname} site produto serviço proposta de valor landing page`;
    }
  } catch { /* keep original url */ }

  const typeLabels: Record<AIAnalysisType, string> = {
    AD_CREATIVE: "criativo de anúncio",
    PROFILE_AUDIT: "perfil nas redes sociais",
    POST_ANALYSIS: "post/conteúdo",
    SITE_ANALYSIS: "site/landing page",
  };

  const userMsg = `Pesquise e forneça um resumo DETALHADO sobre este ${typeLabels[type]}:

URL: ${url}
${platform ? `Plataforma: ${platform}` : ""}
Busca sugerida: ${searchQuery}

Inclua no resumo tudo que encontrar:
- Para perfis: bio completa, número de seguidores, nicho, tipo de conteúdo, frequência de posts, destaques, engajamento
- Para sites: headline, proposta de valor, copy principal, CTAs, preços, prova social, estrutura
- Para posts: conteúdo do post, legenda, hashtags, engajamento

Forneça o máximo de informações possível em português.`;

  const res = (await openai.responses.create({
    model: "gpt-4o-mini",
    tools: [{ type: "web_search_preview" as const }],
    input: [{ role: "user" as const, content: userMsg }],
    max_output_tokens: 2000,
  })) as OpenAIResponse;

  return res.output_text ?? "";
}

// =============================================================================
// JSON EXTRACTOR
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

const AD_CREATIVE_PROMPT = `Você é o diretor criativo mais exigente da publicidade digital brasileira. Analise o criativo de anúncio com precisão cirúrgica.

Avalie os critérios (0-100 cada):
- Hook: primeiros 3 segundos prendem? curiosidade/choque/identificação?
- Clareza: mensagem entendida em <5s? oferta clara?
- CTA: call-to-action visível, urgente e específico?
- Ritmo: pacing mantém interesse? montagem/transições funcionam?
- Valor: proposta clara e convincente? benefícios > features?
- Impacto Emocional: evoca emoção? identificação/desejo/medo/ganância?
- Design: qualidade visual profissional? hierarquia clara? texto legível?
- Fit Audiência: linguagem e tom adequados ao público-alvo?

Decisão: SCALE (score ≥75, sem falhas críticas) | ITERATE (score 50-74) | KILL (score <50 ou falhas em Hook+Clareza+CTA)

Retorne APENAS este JSON (sem markdown):
{
  "score": <0-100>,
  "creative_readiness": { "action": "<SCALE|ITERATE|KILL>", "reasoning": "<2-3 frases>" },
  "breakdown": { "hook": <0-100>, "clareza": <0-100>, "cta": <0-100>, "ritmo": <0-100>, "valor": <0-100>, "impacto_emocional": <0-100>, "design": <0-100>, "fit_audiencia": <0-100> },
  "strengths": ["<específico 1>", "<2>", "<3>"],
  "weaknesses": ["<problema 1>", "<2>", "<3>"],
  "improvements": ["<ação específica 1>", "<2>", "<3>"],
  "recommended_actions": ["<prioridade 1>", "<2>", "<3>"]
}`;

const PROFILE_AUDIT_PROMPT = `Você é especialista em marketing digital e growth para redes sociais.

Com base no conteúdo do perfil fornecido, faça uma auditoria completa avaliando:
1. Clareza de identidade: visitante entende em 5s quem é e o que oferece?
2. Proposta de valor: diferencial claro? por que seguir?
3. Bio/descrição: específica, keywords relevantes, CTA?
4. Credibilidade: sinais de autoridade (verificação, números, prêmios)?
5. Call-to-action: link ou próxima ação clara?
6. Consistência de nicho: focado ou disperso?
7. Nome/handle: memorável e fácil de encontrar?
8. Apelo comercial: atrai marcas e parceiros?

Retorne APENAS este JSON (sem markdown):
{
  "score": <0-100>,
  "summary": "<diagnóstico de 2-3 frases baseado no conteúdo>",
  "strengths": ["<1>", "<2>", "<3>"],
  "weaknesses": ["<1>", "<2>", "<3>"],
  "improvements": ["<1>", "<2>", "<3>"],
  "recommended_actions": ["<1>", "<2>", "<3>"]
}`;

const POST_ANALYSIS_PROMPT = `Você é especialista em crescimento orgânico e algoritmos de redes sociais.

Com base no conteúdo do post fornecido, analise:
1. Hook: primeiros 3 segundos/primeira linha prendem?
2. Retenção: mantém interesse do início ao fim?
3. Valor: ensina, entretém ou inspira claramente?
4. CTA/Engajamento: estimula comentários, compartilhamentos, salvamentos?
5. Legenda/copy: complementa o visual? é conversacional?
6. Hashtags/keywords: alcance otimizado?
7. Formato: adequado para a plataforma?
8. Tendências: aproveita formatos atuais?

Retorne APENAS este JSON (sem markdown):
{
  "score": <0-100>,
  "summary": "<diagnóstico de 2-3 frases>",
  "strengths": ["<1>", "<2>", "<3>"],
  "weaknesses": ["<1>", "<2>", "<3>"],
  "improvements": ["<1>", "<2>", "<3>"],
  "recommended_actions": ["<1>", "<2>", "<3>"]
}`;

const SITE_ANALYSIS_PROMPT = `Você é especialista sênior em CRO, UX e copywriting persuasivo.

Com base no conteúdo do site fornecido, faça uma auditoria profissional:
1. Headline/sub-headline: benefício em <5s? específica? usa dados?
2. UVP: diferencial competitivo explícito? benefício acima do fold?
3. Prova social: depoimentos, números, logos, garantias?
4. CTA: visível sem scroll? copy específico? contraste adequado?
5. Fluxo narrativo (AIDA/PAS): guia à conversão? trata objeções?
6. Copywriting: fala com dores do público? benefícios > features?
7. Design/usabilidade: hierarquia visual? legibilidade? profissional?
8. Atrito: formulários mínimos? processo simples?
9. Mobile/performance: experiência mobile-first?
10. SEO on-page: meta tags? H1/H2 coerentes?

Score: 0-30 fraca | 31-60 mediana | 61-80 boa | 81-100 excelente
Cite exemplos específicos do conteúdo. Priorize por impacto na conversão.

Retorne APENAS este JSON (sem markdown):
{
  "score": <0-100>,
  "summary": "<2-3 achados mais críticos para conversão>",
  "strengths": ["<1>", "<2>", "<3>"],
  "weaknesses": ["<1>", "<2>", "<3>"],
  "improvements": ["<1>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<Quick Win 1>", "<2>", "<3>", "<4>"]
}`;

// =============================================================================
// MAIN ANALYSIS RUNNER
// Estratégia:
//   Image/video → Responses API vision
//   URL → fetchUrlMeta (rápido); se conteúdo insuficiente → web_search (SPAs)
//   Ambos terminam com Chat Completions + response_format para JSON garantido
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
  prefetchedContent?: string; // passed from route to avoid double fetch
}): Promise<AIAnalysisDetail> {
  const { analysisId, type, inputType, inputUrl, pastedContent, imageBase64Frames = [], platform, prefetchedContent } = params;

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
      // ── VISION path ────────────────────────────────────────────────────────
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
        model: "gpt-4o-mini",
        instructions: systemPrompt,
        input: [{ role: "user" as const, content: parts as unknown as string }],
        temperature: 0.3,
        max_output_tokens: 3000,
      })) as OpenAIResponse;

      tokensUsed = res.usage?.total_tokens ?? 0;
      rawJson = extractJson(res.output_text ?? "");

    } else {
      // ── URL/text path ──────────────────────────────────────────────────────
      const contentParts: string[] = [];

      if (inputUrl) contentParts.push(`URL: ${inputUrl}`);
      if (platform) contentParts.push(`Plataforma: ${platform}`);

      // Use prefetched content (from route) or fetch now
      let fetchedContent = prefetchedContent ?? "";
      if (!fetchedContent && inputUrl) {
        const { content } = await fetchUrlMeta(inputUrl);
        fetchedContent = content;
      }

      // If we have good fetched content, use it
      const MINIMUM_USEFUL_CONTENT = 800; // chars — threshold mínimo para conteúdo real
      if (fetchedContent.length >= MINIMUM_USEFUL_CONTENT) {
        contentParts.push("\n--- CONTEÚDO DA PÁGINA ---");
        contentParts.push(fetchedContent);
        contentParts.push("--- FIM ---");
      } else if (inputUrl) {
        // Not enough from fetch (SPA, blocked) → use web_search to get real content
        const searched = await searchUrlContent(inputUrl, type, platform);
        if (searched && searched.length >= MINIMUM_USEFUL_CONTENT) {
          contentParts.push("\n--- CONTEÚDO OBTIDO VIA BUSCA WEB ---");
          contentParts.push(searched);
          contentParts.push("--- FIM ---");
        }
      }

      if (pastedContent) {
        contentParts.push("\n--- INFORMAÇÕES ADICIONAIS ---");
        contentParts.push(pastedContent);
      }

      // Garante que conteúdo real foi obtido antes de chamar a IA
      const hasRealContent = contentParts.some(
        (p) => p.startsWith("\n--- CONTEÚDO") || p.startsWith("\n--- INFORMAÇÕES")
      );
      if (!hasRealContent) {
        throw new Error(
          "Não foi possível obter conteúdo suficiente da URL para análise. " +
          "Cole as informações manualmente no campo de contexto."
        );
      }

      // Chat Completions with response_format — always returns valid JSON
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts.join("\n") },
        ],
      });

      tokensUsed = res.usage?.total_tokens ?? 0;
      rawJson = extractJson(res.choices[0]?.message?.content ?? "{}");
    }

    // ── Parse ──────────────────────────────────────────────────────────────
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
        strengths: Array.isArray(r.strengths) ? r.strengths as string[] : [],
        weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses as string[] : [],
        improvements: Array.isArray(r.improvements) ? r.improvements as string[] : [],
        recommended_actions: Array.isArray(r.recommended_actions) ? r.recommended_actions as string[] : [],
      };
    } else {
      throw new Error("Resposta da IA não pôde ser interpretada como JSON válido. Tente novamente.");
    }

    const updated = await db.aIAnalysis.update({
      where: { id: analysisId },
      data: { status: "COMPLETED", score: parsed.score, result: JSON.parse(JSON.stringify(parsed)), tokensUsed },
    });

    return {
      id: updated.id, type: updated.type as AIAnalysisType, inputType: updated.inputType as AIAnalysisInputType,
      inputUrl: updated.inputUrl, fileUrl: updated.fileUrl, thumbnailUrl: updated.thumbnailUrl,
      platform: updated.platform, score: updated.score, status: updated.status as "COMPLETED",
      error: updated.error, createdAt: updated.createdAt.toISOString(), result: parsed, tokensUsed: updated.tokensUsed,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    await db.aIAnalysis.update({ where: { id: analysisId }, data: { status: "FAILED", error: errorMsg } });
    throw err;
  }
}

// =============================================================================
// CRUD
// =============================================================================

export async function listAnalyses(params: { userId: string; page: number; pageSize: number; type?: AIAnalysisType }): Promise<{ analyses: AIAnalysisSummary[]; total: number }> {
  const { userId, page, pageSize, type } = params;
  const skip = (page - 1) * pageSize;
  const where = { userId, ...(type ? { type } : {}) };
  const [analyses, total] = await db.$transaction([
    db.aIAnalysis.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize, select: { id: true, type: true, inputType: true, inputUrl: true, fileUrl: true, thumbnailUrl: true, platform: true, score: true, status: true, error: true, createdAt: true } }),
    db.aIAnalysis.count({ where }),
  ]);
  return { analyses: analyses.map((a) => ({ ...a, type: a.type as AIAnalysisType, inputType: a.inputType as AIAnalysisInputType, status: a.status as AIAnalysisStatus, createdAt: a.createdAt.toISOString() })), total };
}

export async function getAnalysis(id: string, userId: string): Promise<AIAnalysisDetail | null> {
  const a = await db.aIAnalysis.findFirst({ where: { id, userId } });
  if (!a) return null;
  return { id: a.id, type: a.type as AIAnalysisType, inputType: a.inputType as AIAnalysisInputType, inputUrl: a.inputUrl, fileUrl: a.fileUrl, thumbnailUrl: a.thumbnailUrl, platform: a.platform, score: a.score, status: a.status as AIAnalysisStatus, error: a.error, createdAt: a.createdAt.toISOString(), result: (a.result as AIAnalysisResult | null) ?? null, tokensUsed: a.tokensUsed };
}

export async function deleteAnalysis(id: string, userId: string): Promise<void> {
  await db.aIAnalysis.deleteMany({ where: { id, userId } });
}
