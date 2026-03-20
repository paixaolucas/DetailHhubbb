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
// URL CONTENT FETCHER — busca conteúdo real da página no servidor
// Complementa o web_search_preview (que faz busca mas não acessa URLs diretamente)
// =============================================================================

async function fetchUrlContent(url: string): Promise<string> {
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
    if (!res.ok) return "";
    const html = await res.text();
    // Check if page is mostly JavaScript (SPA like Instagram/TikTok) — not useful
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch?.[1] ?? html;
    const scriptRatio = (bodyContent.match(/<script/gi)?.length ?? 0) / Math.max(bodyContent.length / 1000, 1);
    if (scriptRatio > 5) return ""; // SPA — let web_search handle it

    const extracted: string[] = [];
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) extracted.push(`TÍTULO: ${titleMatch[1].trim()}`);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i)
      || html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i);
    if (descMatch) extracted.push(`DESCRIÇÃO: ${descMatch[1].trim()}`);
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
    while ((m = h1re.exec(html)) !== null) h1Raw.push(m[1].trim());
    const h2Raw: string[] = [];
    const h2re = /<h2[^>]*>([^<]+)<\/h2>/gi;
    while ((m = h2re.exec(html)) !== null && h2Raw.length < 6) h2Raw.push(m[1].trim());
    if (h1Raw.length > 0) extracted.push(`H1: ${h1Raw.join(" | ")}`);
    if (h2Raw.length > 0) extracted.push(`H2: ${h2Raw.join(" | ")}`);

    // Visible body text (strip scripts/styles)
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    if (bodyText.length > 200) extracted.push(`\nCONTEÚDO:\n${bodyText}`);

    return extracted.join("\n");
  } catch {
    return "";
  }
}

// =============================================================================
// JSON EXTRACTOR — parse JSON from model output (no response_format available
// with web_search_preview tool, so we extract from free text)
// =============================================================================

function extractJson(text: string): unknown {
  // 1. Try direct parse
  try { return JSON.parse(text.trim()); } catch { /* continue */ }

  // 2. Try ```json ... ``` block
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch { /* continue */ } }

  // 3. Try first { ... } block (greedy from first { to last })
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
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

Se o usuário forneceu uma URL, use sua capacidade de busca web para acessar e analisar o perfil real. Analise tudo que encontrar: bio, foto, destaques, feed, número de seguidores, nicho, frequência de posts, engajamento visível.

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
  "score": <0-100>,
  "summary": "<resumo executivo de 2-3 frases sobre o perfil>",
  "strengths": ["<ponto forte específico 1>", "<2>", "<3>"],
  "weaknesses": ["<problema que impacta crescimento 1>", "<2>", "<3>"],
  "improvements": ["<melhoria acionável com exemplo 1>", "<2>", "<3>"],
  "recommended_actions": ["<ação prioritária com instrução clara 1>", "<2>", "<3>"]
}`;

const POST_ANALYSIS_PROMPT = `Você é um especialista em crescimento orgânico, algoritmos de redes sociais e copywriting para conteúdo digital.

Se o usuário forneceu uma URL, use sua capacidade de busca web para acessar e analisar o post/conteúdo real. Analise o que estiver disponível: visual, legenda, hashtags, engajamento, formato.

CRITÉRIOS DE AVALIAÇÃO:
1. HOOK (primeiros 3 segundos): Para vídeos — o início prende? Para posts — a primeira linha/visual é impactante?
2. RETENÇÃO: O conteúdo mantém interesse do início ao fim? Existe progressão lógica?
3. VALOR ENTREGUE: O conteúdo ensina, entretém ou inspira de forma clara?
4. CTA E ENGAJAMENTO: Estimula comentários, compartilhamentos, salvamentos?
5. LEGENDA/COPY: A legenda complementa o visual? É conversacional? Quebras de linha?
6. HASHTAGS E KEYWORDS: Estratégia de alcance otimizada?
7. FORMATO E PLATAFORMA: Formato adequado para a plataforma?
8. TENDÊNCIAS: Aproveita formatos ou tendências atuais?

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100>,
  "summary": "<diagnóstico direto do potencial do conteúdo em 2-3 frases>",
  "strengths": ["<ponto forte 1>", "<2>", "<3>"],
  "weaknesses": ["<problema que limita alcance 1>", "<2>", "<3>"],
  "improvements": ["<melhoria com exemplo de como aplicar 1>", "<2>", "<3>"],
  "recommended_actions": ["<ação de maior impacto 1>", "<2>", "<3>"]
}`;

const SITE_ANALYSIS_PROMPT = `Você é um especialista sênior em CRO (Conversion Rate Optimization), UX, copywriting persuasivo e performance de landing pages.

Se o usuário forneceu uma URL, use sua capacidade de busca web para ACESSAR e ANALISAR o site real diretamente. Observe tudo: headline, layout, copy, CTAs, prova social, formulários, design, velocidade percebida, mobile.

DIMENSÕES DE ANÁLISE:

1. HEADLINE E SUB-HEADLINE
   - Comunica o benefício principal em <5 segundos? É específica? Usa dados/números?
   - A sub-headline complementa e aprofunda?

2. PROPOSTA DE VALOR ÚNICA (UVP)
   - O visitante entende PARA QUEM é o produto? O DIFERENCIAL competitivo está explícito?
   - O benefício principal está acima do fold?

3. PROVA SOCIAL E CREDIBILIDADE
   - Depoimentos, cases, números de clientes? Logos de clientes/mídia?
   - Certificações, garantias, selos de confiança?

4. CALL-TO-ACTION (CTA)
   - CTA principal visível sem scroll? Copy específico ("Começar grátis" vs "Enviar")?
   - Múltiplos CTAs ao longo da página? Cor/contraste adequados?

5. FLUXO NARRATIVO (AIDA/PAS)
   - A estrutura guia logicamente até a conversão? Objeções tratadas?

6. COPYWRITING E PERSUASÃO
   - Linguagem fala com dores e desejos do público? Benefícios > features?
   - Urgência/escassez legítima? Tom adequado ao público?

7. DESIGN E USABILIDADE
   - Hierarquia visual correta? Legibilidade (tamanho, contraste)? Aparência profissional?

8. FORMULÁRIOS E ATRITO
   - Mínimo de campos? Processo de conversão simples?

9. MOBILE E PERFORMANCE
   - Experiência mobile-first? Performance otimizada?

10. SEO ON-PAGE
    - Meta title/description otimizados? Estrutura H1/H2 coerente?

INSTRUÇÕES: Seja muito específico — cite exemplos reais do site ao apontar problemas e melhorias. Priorize melhorias por impacto na conversão.
Score: 0-30 fraca | 31-60 mediana | 61-80 boa | 81-100 excelente

Retorne APENAS este JSON válido (sem markdown, sem texto antes ou depois):
{
  "score": <0-100>,
  "summary": "<diagnóstico executivo com 2-3 achados mais críticos para conversão>",
  "strengths": ["<ponto forte específico citando o site 1>", "<2>", "<3>"],
  "weaknesses": ["<problema crítico com impacto na conversão 1>", "<2>", "<3>"],
  "improvements": ["<melhoria com exemplo de implementação e impacto esperado 1>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<Quick Win de maior impacto 1>", "<2>", "<3>", "<4>"]
}`;

// =============================================================================
// MODEL SELECTION
// =============================================================================

function getPromptAndModel(type: AIAnalysisType): { prompt: string; model: string } {
  const prompts: Record<AIAnalysisType, string> = {
    AD_CREATIVE: AD_CREATIVE_PROMPT,
    PROFILE_AUDIT: PROFILE_AUDIT_PROMPT,
    POST_ANALYSIS: POST_ANALYSIS_PROMPT,
    SITE_ANALYSIS: SITE_ANALYSIS_PROMPT,
  };
  return { prompt: prompts[type], model: "gpt-4o" };
}

// =============================================================================
// MAIN ANALYSIS RUNNER — uses Responses API with web_search_preview
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
  const {
    analysisId,
    type,
    inputType,
    inputUrl,
    pastedContent,
    imageBase64Frames = [],
    platform,
  } = params;
  const { prompt, model } = getPromptAndModel(type);

  try {
    // Build user content
    type ContentPart =
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string };

    let userContent: string | ContentPart[];

    if (inputType === "image" || inputType === "video") {
      // Vision: send frames as images — no web search needed
      if (imageBase64Frames.length === 0) {
        throw new Error("Nenhum frame de imagem/vídeo foi enviado para análise.");
      }
      const parts: ContentPart[] = imageBase64Frames.map((b64) => ({
        type: "input_image" as const,
        image_url: b64,
      }));
      const contextLines: string[] = [];
      if (platform) contextLines.push(`Plataforma: ${platform}`);
      if (pastedContent) contextLines.push(`Contexto adicional: ${pastedContent}`);
      if (contextLines.length > 0) {
        parts.push({ type: "input_text" as const, text: contextLines.join("\n") });
      }
      userContent = parts;
    } else {
      // URL or text — fetch content server-side + use web_search as complement
      const lines: string[] = [];

      if (inputUrl) {
        lines.push(`URL PARA ANÁLISE: ${inputUrl}`);
        if (platform) lines.push(`Plataforma: ${platform}`);

        // Try server-side fetch first (works for most sites)
        const fetched = await fetchUrlContent(inputUrl);
        if (fetched) {
          lines.push("\n--- CONTEÚDO EXTRAÍDO DA PÁGINA ---");
          lines.push(fetched);
          lines.push("--- FIM DO CONTEÚDO EXTRAÍDO ---");
          lines.push("\nUSE TAMBÉM a ferramenta de busca web para obter mais contexto sobre este site/perfil e complementar a análise.");
        } else {
          // SPA or blocked — rely entirely on web search
          lines.push("\nO conteúdo da página não pôde ser extraído diretamente (provavelmente uma SPA como Instagram/TikTok).");
          lines.push("USE a ferramenta de busca web para pesquisar informações sobre esta URL/perfil e fazer a análise completa.");
        }
      }

      if (pastedContent) {
        lines.push("\n--- INFORMAÇÕES ADICIONAIS DO USUÁRIO ---");
        lines.push(pastedContent);
      }

      if (lines.length === 0) {
        throw new Error("Nenhum conteúdo foi fornecido para análise.");
      }
      userContent = lines.join("\n");
    }

    // Always use web_search for URL analysis
    const useWebSearch = inputType === "url";

    // Build request
    const requestBody: Parameters<typeof openai.responses.create>[0] = {
      model,
      instructions: prompt,
      input: [
        {
          role: "user" as const,
          content: userContent as string,
        },
      ],
      temperature: 0.3,
      max_output_tokens: 3000,
      ...(useWebSearch ? { tools: [{ type: "web_search_preview" as const }] } : {}),
    };

    const response = (await openai.responses.create(requestBody)) as OpenAIResponse;

    const tokensUsed = response.usage?.total_tokens ?? 0;
    const rawText = response.output_text ?? "";

    let parsed: AIAnalysisResult;
    const raw = extractJson(rawText);

    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      // Normalize creative_readiness (may be nested object or string)
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
        score: Number(r.score ?? 0),
        summary: r.summary as string | undefined,
        creative_readiness,
        creative_readiness_reasoning,
        breakdown: r.breakdown as Record<string, number> | undefined,
        strengths: Array.isArray(r.strengths) ? (r.strengths as string[]) : [],
        weaknesses: Array.isArray(r.weaknesses) ? (r.weaknesses as string[]) : [],
        improvements: Array.isArray(r.improvements) ? (r.improvements as string[]) : [],
        recommended_actions: Array.isArray(r.recommended_actions)
          ? (r.recommended_actions as string[])
          : [],
      };
    } else {
      // Fallback: model returned free text — treat as summary
      parsed = {
        score: 0,
        summary: rawText.slice(0, 300) || "Não foi possível processar a resposta da IA.",
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
      select: {
        id: true,
        type: true,
        inputType: true,
        inputUrl: true,
        fileUrl: true,
        thumbnailUrl: true,
        platform: true,
        score: true,
        status: true,
        error: true,
        createdAt: true,
      },
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

export async function getAnalysis(
  id: string,
  userId: string
): Promise<AIAnalysisDetail | null> {
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
