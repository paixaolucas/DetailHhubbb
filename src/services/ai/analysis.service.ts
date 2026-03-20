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
    model: "gpt-4o", // web_search_preview só é compatível com gpt-4o (não funciona com mini)
    tools: [{ type: "web_search_preview" as const }],
    input: [{ role: "user" as const, content: userMsg }],
    max_output_tokens: 3000,
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

const AD_CREATIVE_PROMPT = `Você é o diretor criativo mais exigente da publicidade digital brasileira com 15 anos de experiência em performance. Analise este criativo com precisão cirúrgica e entregue um relatório completo e profissional.

AVALIAÇÃO POR CRITÉRIO (0-100 cada — seja rigoroso, a média do mercado é 45-55):
- hook: Os primeiros 3 segundos prendem? Existe elemento de curiosidade, choque, identificação ou promessa irresistível?
- clareza: A mensagem é entendida em menos de 5 segundos por alguém que nunca viu a marca?
- cta: O call-to-action é visível, urgente, específico e cria senso de perda ao não agir?
- ritmo: O pacing mantém interesse do início ao fim? Montagem, transições e variações de cena funcionam?
- valor: A proposta de valor é clara, convincente e comunica benefícios concretos acima de features?
- impacto_emocional: Evoca emoção real? Identificação, desejo, medo de perder, ganância ou aspiração?
- design: Qualidade visual profissional? Hierarquia clara? Texto legível? Cores e contraste funcionam?
- fit_audiencia: Linguagem, referências e tom são adequados e ressonantes com o público-alvo?

DECISÃO:
- SCALE: score ≥ 75 E sem falhas críticas em hook, clareza ou CTA — pronto para aumentar budget
- ITERATE: score 50-74 — bom potencial mas ajustes específicos necessários antes de escalar
- KILL: score < 50 OU falhas críticas em 2+ critérios fundamentais — criar novo do zero

REGRAS OBRIGATÓRIAS:
- Seja específico: cite elementos EXATOS do criativo, não generalize
- Cada item das listas deve ter no mínimo 15 palavras com contexto real
- copy_suggestions: escreva versões alternativas REAIS de hooks, headlines ou CTAs que melhorariam o criativo
- ab_test_ideas: proponha testes A/B concretos e mensuráveis com hipóteses claras
- quick_wins: apenas mudanças implementáveis em menos de 2 horas com alto impacto
- kpis: métricas específicas para medir o sucesso após implementar as melhorias

Retorne APENAS este JSON (sem markdown, sem texto fora do JSON):
{
  "score": <0-100>,
  "summary": "<diagnóstico executivo de 2-3 frases com veredicto claro>",
  "diagnose": "<análise detalhada de 4-6 frases cobrindo o que funciona, o que falha e por quê — cite elementos específicos do criativo>",
  "creative_readiness": { "action": "<SCALE|ITERATE|KILL>", "reasoning": "<3-4 frases justificando a decisão com base nos critérios avaliados>" },
  "breakdown": { "hook": <0-100>, "clareza": <0-100>, "cta": <0-100>, "ritmo": <0-100>, "valor": <0-100>, "impacto_emocional": <0-100>, "design": <0-100>, "fit_audiencia": <0-100> },
  "strengths": ["<ponto forte específico 1 — o que exatamente funciona e por quê>", "<2>", "<3>", "<4>", "<5>"],
  "weaknesses": ["<problema específico 1 — elemento exato que está falhando e impacto no resultado>", "<2>", "<3>", "<4>", "<5>"],
  "improvements": ["<melhoria específica 1 — o que mudar, como mudar e resultado esperado>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<ação prioritária 1 — específica, com responsável e resultado esperado>", "<2>", "<3>", "<4>", "<5>"],
  "quick_wins": ["<mudança de alto impacto implementável em < 2h — 1>", "<2>", "<3>"],
  "copy_suggestions": ["<versão alternativa real de hook/headline/CTA — escreva o texto completo>", "<2>", "<3>"],
  "ab_test_ideas": ["<teste A/B específico: hipótese + variável + métrica de sucesso>", "<2>", "<3>"],
  "kpis": ["<KPI específico para medir sucesso pós-implementação>", "<2>", "<3>"]
}`;

const PROFILE_AUDIT_PROMPT = `Você é um consultor sênior de marketing digital especializado em posicionamento e crescimento de perfis sociais para o mercado brasileiro. Faça uma auditoria profissional completa e entregue insights acionáveis.

DIMENSÕES DE ANÁLISE:
1. IDENTIDADE E POSICIONAMENTO: Em 5 segundos um visitante entende quem é, o que faz e para quem? O nicho é claro e específico?
2. PROPOSTA DE VALOR: Qual é o diferencial competitivo real? Por que seguir este perfil e não outro do mesmo nicho?
3. BIO/DESCRIÇÃO: Usa keywords do nicho? Tem CTA claro? É específica o suficiente ou genérica demais?
4. CREDIBILIDADE E AUTORIDADE: Sinais de prova social (verificação, números, resultados, prêmios, mídia)?
5. CALL-TO-ACTION E CONVERSÃO: O link/bio direciona para algum objetivo? A navegação para leads/vendas é clara?
6. CONSISTÊNCIA DE CONTEÚDO: O perfil é focado ou disperso? A linha editorial é coerente?
7. APELO COMERCIAL: Este perfil atrai marcas, parceiros e clientes? Parece profissional e confiável?
8. PRESENÇA E FREQUÊNCIA: A atividade é consistente? O engajamento por seguidor é saudável?

REGRAS OBRIGATÓRIAS:
- Seja específico: cite elementos EXATOS encontrados no perfil (bio, handle, descrição, etc.)
- content_strategy: entregue uma estratégia real com pilares de conteúdo, frequência e formatos recomendados
- copy_suggestions: reescreva a bio completa com uma versão melhorada concreta
- quick_wins: apenas ações de alto impacto executáveis hoje
- kpis: métricas específicas para acompanhar evolução do perfil nos próximos 30 dias

Retorne APENAS este JSON (sem markdown, sem texto fora do JSON):
{
  "score": <0-100>,
  "summary": "<veredicto executivo de 2-3 frases com diagnóstico do estado atual do perfil>",
  "diagnose": "<análise detalhada de 5-7 frases cobrindo posicionamento, autoridade, potencial comercial e principais oportunidades — cite elementos específicos do perfil>",
  "strengths": ["<ponto forte específico 1 com contexto — o que exatamente funciona bem>", "<2>", "<3>", "<4>", "<5>"],
  "weaknesses": ["<problema específico 1 — elemento exato que está falhando e impacto no crescimento>", "<2>", "<3>", "<4>", "<5>"],
  "improvements": ["<melhoria específica 1 — o que mudar, como mudar e resultado esperado>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<ação prioritária 1 — específica, executável e com resultado esperado>", "<2>", "<3>", "<4>", "<5>"],
  "quick_wins": ["<ação de alto impacto executável hoje — 1>", "<2>", "<3>"],
  "content_strategy": ["<pilar de conteúdo 1 com formato, frequência e objetivo>", "<pilar 2>", "<pilar 3>", "<pilar 4>", "<dica de crescimento orgânico específica para o nicho>"],
  "copy_suggestions": ["<versão reescrita completa da bio com todos os elementos otimizados>", "<sugestão de headline para o link na bio>", "<ideia de destaque/story fixo que aumentaria conversão>"],
  "kpis": ["<KPI específico para medir crescimento nos próximos 30 dias>", "<2>", "<3>", "<4>"]
}`;

const POST_ANALYSIS_PROMPT = `Você é especialista em crescimento orgânico, algoritmos de plataformas sociais e copywriting para conteúdo digital. Faça uma análise técnica e profissional deste post/conteúdo.

DIMENSÕES DE ANÁLISE:
1. HOOK (primeiros 3 segundos/primeira linha): Para, cria curiosidade e compele a continuar?
2. RETENÇÃO: O conteúdo mantém interesse do início ao fim? Há pontos de queda de atenção?
3. VALOR ENTREGUE: Ensina algo útil, entretém genuinamente ou inspira de forma específica?
4. GATILHO DE ENGAJAMENTO: Estimula comentários (pergunta, provocação)? Salvamentos (valor denso)? Compartilhamentos (identificação/utilidade)?
5. COPYWRITING/LEGENDA: Complementa e amplifica o visual? Tom conversacional? Storytelling presente?
6. DISTRIBUIÇÃO/ALCANCE: Hashtags estratégicas? SEO da plataforma? Potencial de viralização?
7. ADEQUAÇÃO À PLATAFORMA: Formato, proporção, duração e estilo são ideais para a plataforma?
8. POTENCIAL DE ALGORITMO: Aproveita formatos prioritizados? Tem elementos que o algoritmo favorece?

REGRAS OBRIGATÓRIAS:
- Seja específico: cite elementos EXATOS do conteúdo analisado
- copy_suggestions: reescreva o hook/primeira linha E a legenda completa com versão otimizada
- quick_wins: apenas mudanças implementáveis antes de publicar (ou numa atualização)
- kpis: métricas específicas para avaliar a performance deste tipo de post

Retorne APENAS este JSON (sem markdown, sem texto fora do JSON):
{
  "score": <0-100>,
  "summary": "<veredicto executivo de 2-3 frases com potencial de engajamento e alcance estimado>",
  "diagnose": "<análise detalhada de 5-7 frases cobrindo hook, retenção, valor, gatilhos e adequação à plataforma — cite elementos específicos>",
  "strengths": ["<ponto forte específico 1 — o que exatamente vai gerar engajamento e por quê>", "<2>", "<3>", "<4>", "<5>"],
  "weaknesses": ["<problema específico 1 — elemento que vai prejudicar alcance ou engajamento>", "<2>", "<3>", "<4>"],
  "improvements": ["<melhoria específica 1 — o que mudar, como e resultado esperado em engajamento>", "<2>", "<3>", "<4>", "<5>"],
  "recommended_actions": ["<ação prioritária 1 antes de publicar — específica e com impacto esperado>", "<2>", "<3>", "<4>"],
  "quick_wins": ["<mudança de alto impacto implementável agora — 1>", "<2>", "<3>"],
  "copy_suggestions": ["<hook/primeira linha reescrita completa — versão otimizada>", "<legenda completa reescrita com CTA, storytelling e hashtags>", "<ideia de variação do mesmo conteúdo para outro formato>"],
  "kpis": ["<métrica específica para avaliar performance deste post>", "<2>", "<3>", "<4>"]
}`;

const SITE_ANALYSIS_PROMPT = `Você é especialista sênior em CRO (Conversion Rate Optimization), UX e copywriting persuasivo com experiência em e-commerce, infoprodutos e SaaS brasileiros. Faça uma auditoria completa e profissional com foco em conversão.

DIMENSÕES DE ANÁLISE (avalie com rigor — a média do mercado é mediana):
1. HEADLINE E PROPOSTA DE VALOR: Benefício claro em < 5 segundos? Específica e diferenciada? Usa números/dados?
2. ABOVE THE FOLD: O visitante entende imediatamente o que é, para quem é e por que importa sem rolar a página?
3. PROVA SOCIAL: Depoimentos (com foto, nome, resultado)? Números (clientes, faturamento, avaliações)? Logos? Garantias?
4. CALL-TO-ACTION: Visível sem scroll? Copy específico (não "Saiba mais")? Contraste adequado? Urgência/escassez?
5. FLUXO NARRATIVO (AIDA/PAS): A página guia o visitante do problema à solução de forma lógica? Trata objeções?
6. COPYWRITING: Fala com as dores reais do público? Benefícios > features? Linguagem do cliente ou da empresa?
7. DESIGN E USABILIDADE: Hierarquia visual clara? Legibilidade? Espaçamento? Profissionalismo?
8. ATRITO E FRICÇÃO: Formulários simples? Muitos campos? Processo de compra/contato desburocratizado?
9. MOBILE E PERFORMANCE: Layout funcional no celular? Velocidade adequada? CTAs acessíveis no mobile?
10. SEO ON-PAGE: Meta title/description otimizados? H1/H2 coerentes com o negócio? Estrutura semântica?

ESCALAS: 0-30 fraca | 31-60 mediana | 61-80 boa | 81-100 excelente

REGRAS OBRIGATÓRIAS:
- Seja específico: cite textos, elementos e seções EXATAS encontradas no site
- copy_suggestions: reescreva headline, sub-headline E CTA com versões concretas e melhoradas
- quick_wins: apenas mudanças implementáveis em menos de 2 horas sem redesign
- kpis: métricas para medir impacto das melhorias na conversão

Retorne APENAS este JSON (sem markdown, sem texto fora do JSON):
{
  "score": <0-100>,
  "summary": "<veredicto executivo de 2-3 frases com diagnóstico do estado atual e potencial de conversão>",
  "diagnose": "<análise detalhada de 6-8 frases cobrindo os maiores gargalos de conversão, o que funciona bem e oportunidades imediatas — cite copy e elementos específicos>",
  "strengths": ["<ponto forte específico 1 — elemento exato que está funcionando bem para conversão>", "<2>", "<3>", "<4>"],
  "weaknesses": ["<problema específico 1 — elemento exato que está prejudicando conversão com estimativa de impacto>", "<2>", "<3>", "<4>", "<5>"],
  "improvements": ["<melhoria específica 1 — o que mudar, como implementar e impacto esperado na taxa de conversão>", "<2>", "<3>", "<4>", "<5>", "<6>"],
  "recommended_actions": ["<Quick Win 1 — ação de alto impacto implementável hoje>", "<2>", "<3>", "<4>", "<5>"],
  "quick_wins": ["<mudança de alto impacto em < 2h sem redesign — 1>", "<2>", "<3>"],
  "copy_suggestions": ["<headline reescrita completa — versão otimizada com benefício claro>", "<sub-headline reescrita com proposta de valor específica>", "<CTA reescrito com urgência e especificidade>", "<reescrita de seção de prova social ou depoimento>"],
  "kpis": ["<KPI específico para medir impacto das melhorias — taxa de conversão, bounce rate, etc.>", "<2>", "<3>", "<4>"]
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
        // Threshold não aplicado ao web_search: ele é explicitamente solicitado a retornar
        // um resumo detalhado — qualquer resultado não-vazio é válido para análise.
        const searched = await searchUrlContent(inputUrl, type, platform);
        if (searched && searched.trim().length > 0) {
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
        diagnose: r.diagnose as string | undefined,
        creative_readiness,
        creative_readiness_reasoning,
        breakdown: r.breakdown as Record<string, number> | undefined,
        strengths: Array.isArray(r.strengths) ? r.strengths as string[] : [],
        weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses as string[] : [],
        improvements: Array.isArray(r.improvements) ? r.improvements as string[] : [],
        recommended_actions: Array.isArray(r.recommended_actions) ? r.recommended_actions as string[] : [],
        quick_wins: Array.isArray(r.quick_wins) ? r.quick_wins as string[] : undefined,
        kpis: Array.isArray(r.kpis) ? r.kpis as string[] : undefined,
        copy_suggestions: Array.isArray(r.copy_suggestions) ? r.copy_suggestions as string[] : undefined,
        content_strategy: Array.isArray(r.content_strategy) ? r.content_strategy as string[] : undefined,
        ab_test_ideas: Array.isArray(r.ab_test_ideas) ? r.ab_test_ideas as string[] : undefined,
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
