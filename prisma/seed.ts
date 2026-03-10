// =============================================================================
// DATABASE SEED
// Creates realistic test data for all platform entities
// =============================================================================

import { PrismaClient, UserRole, CommissionType, SaaSToolCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // =============================================================================
  // CLEAN UP (development only)
  // =============================================================================
  await db.$transaction([
    db.aIUsageLog.deleteMany(),
    db.analyticsEvent.deleteMany(),
    db.contentProgress.deleteMany(),
    db.liveSessionAttendee.deleteMany(),
    db.liveSession.deleteMany(),
    db.contentLesson.deleteMany(),
    db.contentModule.deleteMany(),
    db.commissionTransaction.deleteMany(),
    db.commissionRule.deleteMany(),
    db.payment.deleteMany(),
    db.communityMembership.deleteMany(),
    db.platformMembership.deleteMany(),
    db.platformPlan.deleteMany(),
    db.subscriptionPlan.deleteMany(),
    db.community.deleteMany(),
    db.influencer.deleteMany(),
    db.refreshToken.deleteMany(),
    db.marketplacePurchase.deleteMany(),
    db.marketplaceListing.deleteMany(),
    db.saasTool.deleteMany(),
    db.user.deleteMany(),
  ]);

  const saltRounds = 12;

  // =============================================================================
  // SUPER ADMIN
  // =============================================================================
  const superAdmin = await db.user.create({
    data: {
      email: "admin@comunidadehub.com",
      passwordHash: await bcrypt.hash("Admin@123456!", saltRounds),
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      referralCode: "ADMIN001",
    },
  });
  console.log("✅ SuperAdmin created:", superAdmin.email);

  // =============================================================================
  // INFLUENCERS
  // =============================================================================
  const barbaUser = await db.user.create({
    data: {
      email: "barba@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Barba",
      lastName: "Oficial",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "BARBA001",
    },
  });

  const corujaoUser = await db.user.create({
    data: {
      email: "corujao@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Corujão",
      lastName: "ZK",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "CORUJAO001",
    },
  });

  const netoUser = await db.user.create({
    data: {
      email: "neto@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Neto",
      lastName: "NoMel",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "NETO001",
    },
  });

  const influencerBarba = await db.influencer.create({
    data: {
      userId: barbaUser.id,
      displayName: "Barba",
      bio: "Força de transformação na indústria de estética automotiva. Queimando mitos e trazendo clareza sem enrolação.",
      socialLinks: {
        instagram: "@barba",
        youtube: "BarbaOficial",
      },
      isVerified: true,
    },
  });

  const influencerCorujao = await db.influencer.create({
    data: {
      userId: corujaoUser.id,
      displayName: "Corujão",
      bio: "Representa a rua. Nunca esquecer da origem e sempre respeitar quem veio de baixo. Não é estúdio, é zika!",
      socialLinks: {
        instagram: "@corujaozk",
      },
      isVerified: true,
    },
  });

  const influencerNeto = await db.influencer.create({
    data: {
      userId: netoUser.id,
      displayName: "Neto",
      bio: "Educação em estética automotiva de qualidade. Comunidade no Mel — aprenda do zero ao avançado.",
      socialLinks: {
        instagram: "@neto",
      },
      isVerified: true,
    },
  });

  console.log("✅ Influencers created");

  // =============================================================================
  // COMMUNITIES
  // =============================================================================
  const communityBarba = await db.community.create({
    data: {
      influencerId: influencerBarba.id,
      name: "Barba",
      slug: "barba",
      description:
        "A comunidade do Barba — força de transformação na estética automotiva. Aqui a gente queima mitos, fala a verdade e evolui junto. Sem pink lemonade.",
      shortDescription: "Estética automotiva sem enrolação. Queimando mitos.",
      primaryColor: "#FA4616",
      secondaryColor: "#000000",
      accentColor: "#FFFFFF",
      bannerUrl: "/photos/barba-thumb.png",
      isPublished: true,
      isPrivate: false,
      memberCount: 0,
      welcomeMessage:
        "Bem-vindo à comunidade do Barba! Aqui a gente não aceita pink lemonade. É conteúdo de verdade, técnica de verdade, resultado de verdade. Bora queimar os mitos!",
      rules:
        "1. Sem pink lemonade — só conteúdo real\n2. Respeite todos os membros\n3. Compartilhe seus resultados\n4. Sem spam ou autopromação\n5. Dúvidas? Pergunta sem medo",
      tags: ["estetica-automotiva", "polimento", "detailing", "barba", "queimando-mitos"],
    },
  });

  const communityCorujao = await db.community.create({
    data: {
      influencerId: influencerCorujao.id,
      name: "Corujão",
      slug: "corujao",
      description:
        "A comunidade do Corujão representa a rua. Não é estúdio, não é estética, não é detail. É zika! Nunca vamos esquecer da nossa origem.",
      shortDescription: "Não é estúdio, não é detail. É zika! @corujaozk",
      primaryColor: "#F7941D",
      secondaryColor: "#000000",
      accentColor: "#FFFFFF",
      bannerUrl: "/photos/corujao-thumb.png",
      isPublished: true,
      isPrivate: false,
      memberCount: 0,
      welcomeMessage:
        "Fala, rapaziada! Seja bem-vindo à comunidade do Corujão. Aqui a gente representa a rua, nunca esquece da origem e respeita quem veio de baixo. É zika!",
      rules:
        "1. Represente a rua com respeito\n2. Nunca esqueça da origem\n3. Compartilhe o que sabe\n4. Sem frescura, sem ego\n5. A comunidade é de todos",
      tags: ["detailing", "estetica", "rua", "zika", "corujao", "corujaozk"],
    },
  });

  const communityNoMel = await db.community.create({
    data: {
      influencerId: influencerNeto.id,
      name: "Comunidade no Mel",
      slug: "no-mel",
      description:
        "A Comunidade no Mel do Neto é a plataforma de educação em estética automotiva mais completa. Do básico ao avançado, aprenda com quem faz.",
      shortDescription: "Educação em estética automotiva do zero ao avançado.",
      primaryColor: "#FCB749",
      secondaryColor: "#4B92F9",
      accentColor: "#221F20",
      bannerUrl: "/photos/neto-thumb.png",
      isPublished: true,
      isPrivate: false,
      memberCount: 0,
      welcomeMessage:
        "Bem-vindo à Comunidade no Mel! Aqui você vai encontrar aulas, técnicas e uma galera apaixonada por estética automotiva. Bora aprender!",
      rules:
        "1. Respeite todos os membros\n2. Compartilhe suas dúvidas e resultados\n3. Sem spam ou conteúdo off-topic\n4. Ajude quem está começando\n5. Aproveite o conteúdo ao máximo",
      tags: ["estetica-automotiva", "aulas", "detailing", "polimento", "no-mel", "neto"],
    },
  });

  console.log("✅ Communities created");

  // =============================================================================
  // SPACES
  // =============================================================================

  // Barba spaces — laranja fogo, vibrante e direto
  await db.space.createMany({
    data: [
      {
        communityId: communityBarba.id,
        name: "Feed Geral",
        slug: "feed",
        description: "O coração da comunidade. Compartilhe, discuta e evolua.",
        icon: "🔥",
        type: "DISCUSSION",
        sortOrder: 1,
        isDefault: true,
      },
      {
        communityId: communityBarba.id,
        name: "Queimando Mitos",
        slug: "queimando-mitos",
        description: "Desmistificando as maiores mentiras da estética automotiva.",
        icon: "💥",
        type: "DISCUSSION",
        sortOrder: 2,
      },
      {
        communityId: communityBarba.id,
        name: "Técnicas & Processos",
        slug: "tecnicas-processos",
        description: "Polimento, PPF, vitrificação, lavagem — técnica de verdade.",
        icon: "🛠️",
        type: "DISCUSSION",
        sortOrder: 3,
      },
      {
        communityId: communityBarba.id,
        name: "Produtos Testados",
        slug: "produtos-testados",
        description: "Reviews honestos de produtos. Sem patrocínio disfarçado.",
        icon: "🧴",
        type: "SHOWCASE",
        sortOrder: 4,
      },
      {
        communityId: communityBarba.id,
        name: "Tira-Dúvidas",
        slug: "tira-duvidas",
        description: "Pergunta sem medo. A comunidade responde.",
        icon: "❓",
        type: "QA",
        sortOrder: 5,
      },
      {
        communityId: communityBarba.id,
        name: "Avisos",
        slug: "avisos",
        description: "Comunicados oficiais do Barba.",
        icon: "📢",
        type: "ANNOUNCEMENT",
        sortOrder: 6,
      },
    ],
  });

  // Corujão spaces — laranja da rua, estilo urbano
  await db.space.createMany({
    data: [
      {
        communityId: communityCorujao.id,
        name: "Feed",
        slug: "feed",
        description: "Tudo rola aqui. A rua fala.",
        icon: "🦉",
        type: "DISCUSSION",
        sortOrder: 1,
        isDefault: true,
      },
      {
        communityId: communityCorujao.id,
        name: "É Zika!",
        slug: "e-zika",
        description: "Conteúdo que é zika mesmo. Sem frescura.",
        icon: "⚡",
        type: "DISCUSSION",
        sortOrder: 2,
      },
      {
        communityId: communityCorujao.id,
        name: "Técnicas da Rua",
        slug: "tecnicas-da-rua",
        description: "Técnicas e processos que a rua ensina. Do jeito certo.",
        icon: "🔧",
        type: "DISCUSSION",
        sortOrder: 3,
      },
      {
        communityId: communityCorujao.id,
        name: "Showcase",
        slug: "showcase",
        description: "Mostra o seu trampo. A galera quer ver.",
        icon: "🚗",
        type: "SHOWCASE",
        sortOrder: 4,
      },
      {
        communityId: communityCorujao.id,
        name: "Tira-Dúvidas",
        slug: "tira-duvidas",
        description: "Pergunta à comunidade. Sem julgamento.",
        icon: "❓",
        type: "QA",
        sortOrder: 5,
      },
      {
        communityId: communityCorujao.id,
        name: "Avisos",
        slug: "avisos",
        description: "Comunicados do Corujão.",
        icon: "📢",
        type: "ANNOUNCEMENT",
        sortOrder: 6,
      },
    ],
  });

  // Comunidade no Mel spaces — âmbar e azul, educacional
  await db.space.createMany({
    data: [
      {
        communityId: communityNoMel.id,
        name: "Feed",
        slug: "feed",
        description: "Atualizações, posts e novidades da comunidade.",
        icon: "🍯",
        type: "DISCUSSION",
        sortOrder: 1,
        isDefault: true,
      },
      {
        communityId: communityNoMel.id,
        name: "Aulas & Conteúdo",
        slug: "aulas",
        description: "Discussões sobre as aulas e conteúdos do Neto.",
        icon: "🎓",
        type: "DISCUSSION",
        sortOrder: 2,
      },
      {
        communityId: communityNoMel.id,
        name: "Técnicas Avançadas",
        slug: "tecnicas-avancadas",
        description: "Polimento, PPF, ceramic coat e mais — nível avançado.",
        icon: "✨",
        type: "DISCUSSION",
        sortOrder: 3,
      },
      {
        communityId: communityNoMel.id,
        name: "Tira-Dúvidas",
        slug: "tira-duvidas",
        description: "Sua dúvida tem resposta aqui.",
        icon: "❓",
        type: "QA",
        sortOrder: 4,
      },
      {
        communityId: communityNoMel.id,
        name: "Showcase",
        slug: "showcase",
        description: "Mostre seus trabalhos e resultados.",
        icon: "🏆",
        type: "SHOWCASE",
        sortOrder: 5,
      },
      {
        communityId: communityNoMel.id,
        name: "Avisos",
        slug: "avisos",
        description: "Comunicados oficiais.",
        icon: "📢",
        type: "ANNOUNCEMENT",
        sortOrder: 6,
      },
    ],
  });

  console.log("✅ Spaces created");


  // =============================================================================
  // COMMISSION RULES
  // =============================================================================
  await db.commissionRule.createMany({
    data: [
      {
        communityId: communityBarba.id,
        name: "Comissão padrão",
        description: "70% para o Barba, 10% de taxa de plataforma",
        type: CommissionType.PERCENTAGE,
        rate: 0.7,
        platformFee: 0.1,
        isActive: true,
      },
      {
        communityId: communityCorujao.id,
        name: "Comissão padrão",
        description: "70% para o Corujão, 10% de taxa de plataforma",
        type: CommissionType.PERCENTAGE,
        rate: 0.7,
        platformFee: 0.1,
        isActive: true,
      },
      {
        communityId: communityNoMel.id,
        name: "Comissão padrão",
        description: "75% para o Neto, 10% de taxa de plataforma",
        type: CommissionType.PERCENTAGE,
        rate: 0.75,
        platformFee: 0.1,
        isActive: true,
      },
    ],
  });

  console.log("✅ Commission rules created");

  // =============================================================================
  // CONTENT MODULES & LESSONS
  // =============================================================================

  // Barba — módulos de estética automotiva
  const moduloBarba1 = await db.contentModule.create({
    data: {
      communityId: communityBarba.id,
      title: "Fundamentos da Estética Automotiva",
      description: "Os pilares que todo detailer precisa dominar antes de qualquer coisa",
      sortOrder: 1,
      isPublished: true,
    },
  });

  const moduloBarba2 = await db.contentModule.create({
    data: {
      communityId: communityBarba.id,
      title: "Polimento Profissional",
      description: "Técnicas de correção de pintura do básico ao avançado",
      sortOrder: 2,
      isPublished: true,
      unlockAfterDays: 7,
    },
  });

  await db.contentLesson.createMany({
    data: [
      {
        moduleId: moduloBarba1.id,
        title: "O que é estética automotiva de verdade?",
        description: "Separando o que importa do pink lemonade",
        type: "VIDEO",
        videoDuration: 1800,
        sortOrder: 1,
        isPublished: true,
        isFree: true,
      },
      {
        moduleId: moduloBarba1.id,
        title: "Entendendo a tinta do carro",
        description: "Camadas, tipos e como cada uma reage ao polimento",
        type: "VIDEO",
        videoDuration: 2400,
        sortOrder: 2,
        isPublished: true,
      },
      {
        moduleId: moduloBarba1.id,
        title: "Guia de produtos essenciais",
        description: "O que você precisa ter (e o que é enganação)",
        type: "TEXT",
        content: "Guia completo de produtos para iniciar na estética automotiva...",
        sortOrder: 3,
        isPublished: true,
      },
      {
        moduleId: moduloBarba2.id,
        title: "Máquinas de polimento — qual escolher?",
        description: "Roto-orbital, dual action, elétrica ou pneumática",
        type: "VIDEO",
        videoDuration: 3200,
        sortOrder: 1,
        isPublished: true,
      },
      {
        moduleId: moduloBarba2.id,
        title: "Correção de pintura passo a passo",
        description: "Do clay bar ao polish final",
        type: "VIDEO",
        videoDuration: 4500,
        sortOrder: 2,
        isPublished: true,
      },
    ],
  });

  // Comunidade no Mel — módulos educacionais do Neto
  const moduloNeto1 = await db.contentModule.create({
    data: {
      communityId: communityNoMel.id,
      title: "Fundamentos",
      description: "Estética automotiva do zero. Base sólida para quem está começando.",
      sortOrder: 1,
      isPublished: true,
    },
  });

  const moduloNeto2 = await db.contentModule.create({
    data: {
      communityId: communityNoMel.id,
      title: "Técnicas Intermediárias",
      description: "Suba de nível. Polimento, vitrificação e proteção.",
      sortOrder: 2,
      isPublished: true,
      unlockAfterDays: 14,
    },
  });

  await db.contentLesson.createMany({
    data: [
      {
        moduleId: moduloNeto1.id,
        title: "Aula 01 — O que é estética automotiva?",
        description: "Introdução completa: conceitos, mercado e oportunidades",
        type: "VIDEO",
        videoDuration: 2100,
        sortOrder: 1,
        isPublished: true,
        isFree: true,
      },
      {
        moduleId: moduloNeto1.id,
        title: "Aula 02 — Lavagem e descontaminação",
        description: "Como lavar certo e preparar a superfície",
        type: "VIDEO",
        videoDuration: 2700,
        sortOrder: 2,
        isPublished: true,
      },
      {
        moduleId: moduloNeto1.id,
        title: "Aula 03 — Produtos e ferramentas básicas",
        description: "Kit inicial: o que comprar e por quê",
        type: "VIDEO",
        videoDuration: 1900,
        sortOrder: 3,
        isPublished: true,
      },
      {
        moduleId: moduloNeto2.id,
        title: "Aula 04 — Polimento: correção de pintura",
        description: "Técnica de polimento completa com máquina dual action",
        type: "VIDEO",
        videoDuration: 5400,
        sortOrder: 1,
        isPublished: true,
      },
      {
        moduleId: moduloNeto2.id,
        title: "Aula 05 — Vitrificação e proteção",
        description: "Cerâmica, cera e PPF — quando usar cada um",
        type: "VIDEO",
        videoDuration: 3600,
        sortOrder: 2,
        isPublished: true,
      },
    ],
  });

  console.log("✅ Content created");

  // =============================================================================
  // LIVE SESSIONS
  // =============================================================================
  await db.liveSession.createMany({
    data: [
      {
        communityId: communityBarba.id,
        hostId: barbaUser.id,
        title: "Queimando Mitos: Os maiores erros no polimento",
        description: "Ao vivo com o Barba desmontando os mitos mais perigosos da estética automotiva",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isRecorded: true,
      },
      {
        communityId: communityBarba.id,
        hostId: barbaUser.id,
        title: "Tira-Dúvidas ao Vivo — Polimento e Proteção",
        description: "Sessão aberta: manda sua dúvida que o Barba responde",
        status: "ENDED",
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        actualAttendees: 318,
        isRecorded: true,
      },
      {
        communityId: communityCorujao.id,
        hostId: corujaoUser.id,
        title: "É Zika! — Live da Rua",
        description: "Corujão ao vivo direto da rua. Conteúdo real, sem script.",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        isRecorded: true,
      },
      {
        communityId: communityNoMel.id,
        hostId: netoUser.id,
        title: "Aula ao Vivo: Correção de Pintura na Prática",
        description: "O Neto demonstrando correção de pintura em tempo real",
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isRecorded: true,
      },
    ],
  });

  console.log("✅ Live sessions created");

  // =============================================================================
  // SAAS TOOLS
  // =============================================================================
  await db.saasTool.createMany({
    data: [
      {
        name: "RD Station",
        description: "Plataforma completa de automação de marketing para empresas brasileiras. CRM, email marketing, landing pages e mais.",
        shortDesc: "Marketing automation made in Brazil",
        category: SaaSToolCategory.MARKETING,
        websiteUrl: "https://rdstation.com",
        isActive: true,
        isFeatured: true,
        tags: ["crm", "email", "automacao", "marketing"],
        pricing: { starter: "R$50/mês", pro: "R$200/mês" },
        rating: 4.5,
        sortOrder: 1,
      },
      {
        name: "Hotmart",
        description: "Plataforma de infoprodutos e cursos online. Venda seus produtos digitais com segurança.",
        category: SaaSToolCategory.FINANCE,
        websiteUrl: "https://hotmart.com",
        isActive: true,
        isFeatured: true,
        tags: ["infoprodutos", "cursos", "pagamentos"],
        pricing: { free: "Gratuito + comissão" },
        rating: 4.3,
        sortOrder: 2,
      },
      {
        name: "Notion",
        description: "Workspace all-in-one para notas, projetos, wikis e banco de dados.",
        category: SaaSToolCategory.PRODUCTIVITY,
        websiteUrl: "https://notion.so",
        isActive: true,
        tags: ["produtividade", "notas", "projetos", "wiki"],
        pricing: { free: "Gratuito", pro: "$8/mês" },
        rating: 4.7,
        sortOrder: 3,
      },
      {
        name: "Canva",
        description: "Design gráfico simplificado para criar posts, apresentações, logos e muito mais.",
        category: SaaSToolCategory.DESIGN,
        websiteUrl: "https://canva.com",
        isActive: true,
        isFeatured: true,
        tags: ["design", "criativo", "posts", "apresentacoes"],
        pricing: { free: "Gratuito", pro: "R$54/mês" },
        rating: 4.8,
        sortOrder: 4,
      },
      {
        name: "Google Analytics 4",
        description: "Análise web avançada para entender o comportamento dos seus usuários.",
        category: SaaSToolCategory.ANALYTICS,
        websiteUrl: "https://analytics.google.com",
        isActive: true,
        tags: ["analytics", "dados", "trafego"],
        pricing: { free: "Gratuito" },
        rating: 4.4,
        sortOrder: 5,
      },
    ],
  });

  console.log("✅ SaaS tools created");

  // =============================================================================
  // MARKETPLACE LISTINGS
  // =============================================================================
  await db.marketplaceListing.createMany({
    data: [
      {
        sellerId: barbaUser.id,
        title: "Guia Definitivo de Polimento — Barba",
        slug: "guia-polimento-barba",
        description: "O guia completo do Barba para polimento profissional. Sem pink lemonade, só técnica real.",
        shortDesc: "Técnica de polimento sem enrolação",
        type: "EBOOK",
        status: "ACTIVE",
        price: 67,
        currency: "brl",
        coverImageUrl: null,
        tags: ["polimento", "estetica", "barba", "detailing"],
        categories: ["estetica-automotiva", "tecnica"],
        features: ["120 páginas", "Técnicas passo a passo", "Lista de produtos recomendados", "Acesso vitalício"],
        isFeatured: true,
        totalSales: 245,
        averageRating: 4.9,
        reviewCount: 87,
      },
      {
        sellerId: netoUser.id,
        title: "Pack de Aulas Bônus — Comunidade no Mel",
        slug: "pack-aulas-bonus-no-mel",
        description: "Módulo extra com 10 aulas avançadas do Neto sobre cerâmica, PPF e cuidados premium.",
        shortDesc: "10 aulas avançadas de estética automotiva",
        type: "COURSE",
        status: "ACTIVE",
        price: 197,
        currency: "brl",
        tags: ["aulas", "ceramica", "ppf", "estetica", "neto"],
        categories: ["estetica-automotiva", "educacao"],
        features: ["10 aulas em vídeo", "Material de apoio", "Certificado", "Acesso vitalício"],
        isFeatured: true,
        totalSales: 132,
        averageRating: 4.8,
        reviewCount: 54,
      },
      {
        sellerId: corujaoUser.id,
        title: "Checklist Zika — Processo Completo",
        slug: "checklist-zika-corujao",
        description: "O checklist do Corujão para não errar em nenhum passo do processo. Direto da rua.",
        shortDesc: "Checklist completo do processo de detailing",
        type: "TEMPLATE",
        status: "ACTIVE",
        price: 27,
        currency: "brl",
        tags: ["checklist", "processo", "detailing", "corujao"],
        categories: ["estetica-automotiva", "produtividade"],
        features: ["Checklist imprimível", "Versão digital editável", "Suporte por 30 dias"],
        isFeatured: false,
        totalSales: 198,
        averageRating: 4.7,
        reviewCount: 63,
      },
    ],
  });

  console.log("✅ Marketplace listings created");

  // =============================================================================
  // REGULAR MEMBERS
  // =============================================================================
  const member1 = await db.user.create({
    data: {
      email: "membro1@email.com",
      passwordHash: await bcrypt.hash("Membro@123!", saltRounds),
      firstName: "Carlos",
      lastName: "Oliveira",
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: "CARLOS001",
    },
  });

  const member2 = await db.user.create({
    data: {
      email: "membro2@email.com",
      passwordHash: await bcrypt.hash("Membro@123!", saltRounds),
      firstName: "Maria",
      lastName: "Santos",
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: "MARIA001",
    },
  });


  // Sync member counts
  await db.community.update({
    where: { id: communityBarba.id },
    data: { memberCount: 2 },
  });

  console.log("✅ Members and memberships created");

  // =============================================================================
  // PAYMENTS (historical data)
  // =============================================================================
  await db.payment.createMany({
    data: [
      {
        userId: member1.id,
        amount: 197,
        currency: "brl",
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: member2.id,
        amount: 97,
        currency: "brl",
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        userId: member1.id,
        amount: 197,
        currency: "brl",
        status: "SUCCEEDED",
        type: "SUBSCRIPTION",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Payment history created");

  // =============================================================================
  // PLATFORM PLAN + MEMBERSHIPS para membros de teste
  // =============================================================================
  const platformPlan = await db.platformPlan.create({
    data: {
      name: "DetailHub Anual",
      description: "Acesso completo a todas as comunidades automotivas da plataforma.",
      price: 600,
      currency: "brl",
      interval: "year",
      intervalCount: 1,
      trialDays: 0,
      features: [
        "Acesso a todas as comunidades",
        "Conteúdo ilimitado",
        "Lives & streaming",
        "Marketplace",
        "Auto AI",
        "Leaderboard e badges",
      ],
      isActive: true,
    },
  });

  // Membros de teste já têm assinatura ativa da plataforma
  await db.platformMembership.createMany({
    data: [
      {
        userId: member1.id,
        planId: platformPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        userId: member2.id,
        planId: platformPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Platform plan + memberships created");

  console.log(`
╔═══════════════════════════════════════════════╗
║           SEED COMPLETED SUCCESSFULLY          ║
╠═══════════════════════════════════════════════╣
║ SuperAdmin    admin@comunidadehub.com          ║
║ Password      Admin@123456!                    ║
╠═══════════════════════════════════════════════╣
║ Barba         barba@comunidade.com             ║
║ Corujão       corujao@comunidade.com           ║
║ Neto          neto@comunidade.com              ║
║ Password      Influencer@123!                  ║
╠═══════════════════════════════════════════════╣
║ Communities:                                   ║
║   /community/barba                             ║
║   /community/corujao                           ║
║   /community/no-mel                            ║
╠═══════════════════════════════════════════════╣
║ Member 1      membro1@email.com                ║
║ Member 2      membro2@email.com                ║
║ Password      Membro@123!                      ║
╚═══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
