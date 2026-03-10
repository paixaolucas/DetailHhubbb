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
  const inf1User = await db.user.create({
    data: {
      email: "joao@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "João",
      lastName: "Mendes",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "JOAO001",
    },
  });

  const inf2User = await db.user.create({
    data: {
      email: "ana@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Ana",
      lastName: "Costa",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "ANA001",
    },
  });

  const influencer1 = await db.influencer.create({
    data: {
      userId: inf1User.id,
      displayName: "João Mendes",
      bio: "Especialista em marketing digital e growth hacking. Mais de 10 anos no mercado.",
      websiteUrl: "https://joaomendes.com",
      socialLinks: {
        instagram: "@joaomendes",
        youtube: "JoaoMendesOficial",
        linkedin: "joao-mendes",
      },
      isVerified: true,
    },
  });

  const influencer2 = await db.influencer.create({
    data: {
      userId: inf2User.id,
      displayName: "Ana Costa",
      bio: "Mentora de negócios digitais e criadora de conteúdo sobre empreendedorismo feminino.",
      isVerified: true,
    },
  });

  console.log("✅ Influencers created");

  // =============================================================================
  // COMMUNITIES
  // =============================================================================
  const community1 = await db.community.create({
    data: {
      influencerId: influencer1.id,
      name: "Marketing Digital Pro",
      slug: "marketing-digital-pro",
      description:
        "A comunidade definitiva para profissionais e aspirantes do marketing digital. Aqui você aprende, pratica e cresce.",
      shortDescription: "Aprenda marketing digital do zero ao avançado",
      primaryColor: "#6366f1",
      secondaryColor: "#4f46e5",
      accentColor: "#818ef8",
      isPublished: true,
      isPrivate: false,
      memberCount: 0,
      welcomeMessage:
        "Bem-vindo à melhor comunidade de marketing digital do Brasil! Aqui você vai encontrar conteúdo exclusivo, mentorias e uma rede incrível.",
      rules:
        "1. Seja respeitoso\n2. Compartilhe conhecimento\n3. Sem spam ou autopromoção\n4. Contribua ativamente",
      tags: ["marketing", "digital", "growth", "seo", "ads"],
    },
  });

  const community2 = await db.community.create({
    data: {
      influencerId: influencer2.id,
      name: "Empreendedoras Digitais",
      slug: "empreendedoras-digitais",
      description:
        "Comunidade exclusiva para mulheres empreendedoras que querem escalar seus negócios digitais.",
      shortDescription: "Negócios digitais para mulheres que querem mais",
      primaryColor: "#ec4899",
      secondaryColor: "#db2777",
      isPublished: true,
      memberCount: 0,
      tags: ["empreendedorismo", "mulheres", "negócios", "digital"],
    },
  });

  console.log("✅ Communities created");

  // =============================================================================
  // SUBSCRIPTION PLANS
  // =============================================================================
  const plan1Basic = await db.subscriptionPlan.create({
    data: {
      communityId: community1.id,
      name: "Básico",
      description: "Acesso a conteúdo fundamental e comunidade",
      price: 97,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      features: [
        "Acesso ao conteúdo básico",
        "Participação na comunidade",
        "Newsletter exclusiva",
        "1 live por mês",
      ],
    },
  });

  const plan1Pro = await db.subscriptionPlan.create({
    data: {
      communityId: community1.id,
      name: "Pro",
      description: "Acesso completo + mentoria em grupo",
      price: 197,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      features: [
        "Tudo do plano Básico",
        "Conteúdo avançado",
        "Mentoria em grupo mensal",
        "Acesso a todos os lives",
        "Templates exclusivos",
        "Suporte prioritário",
      ],
    },
  });

  await db.subscriptionPlan.create({
    data: {
      communityId: community2.id,
      name: "Starter",
      description: "Comece sua jornada empreendedora",
      price: 147,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      features: [
        "Acesso ao conteúdo",
        "Comunidade de suporte",
        "2 lives por mês",
      ],
    },
  });

  console.log("✅ Subscription plans created");

  // =============================================================================
  // COMMISSION RULES
  // =============================================================================
  await db.commissionRule.create({
    data: {
      communityId: community1.id,
      name: "Comissão padrão",
      description: "70% para o influenciador, 10% de taxa de plataforma",
      type: CommissionType.PERCENTAGE,
      rate: 0.7,
      platformFee: 0.1,
      isActive: true,
    },
  });

  await db.commissionRule.create({
    data: {
      communityId: community2.id,
      name: "Comissão padrão",
      type: CommissionType.PERCENTAGE,
      rate: 0.75,
      platformFee: 0.1,
      isActive: true,
    },
  });

  console.log("✅ Commission rules created");

  // =============================================================================
  // CONTENT MODULES & LESSONS
  // =============================================================================
  const module1 = await db.contentModule.create({
    data: {
      communityId: community1.id,
      title: "Fundamentos do Marketing Digital",
      description: "Os pilares essenciais para entender o marketing digital moderno",
      sortOrder: 1,
      isPublished: true,
    },
  });

  const module2 = await db.contentModule.create({
    data: {
      communityId: community1.id,
      title: "SEO Avançado",
      description: "Técnicas avançadas de otimização para mecanismos de busca",
      sortOrder: 2,
      isPublished: true,
      unlockAfterDays: 7,
    },
  });

  await db.contentLesson.createMany({
    data: [
      {
        moduleId: module1.id,
        title: "O que é marketing digital?",
        description: "Introdução completa ao universo do marketing digital",
        type: "VIDEO",
        videoUrl: "https://example.com/video1",
        videoDuration: 1800,
        sortOrder: 1,
        isPublished: true,
        isFree: true,
      },
      {
        moduleId: module1.id,
        title: "Funil de vendas digital",
        description: "Como criar e otimizar seu funil de conversão",
        type: "VIDEO",
        videoDuration: 2400,
        sortOrder: 2,
        isPublished: true,
      },
      {
        moduleId: module1.id,
        title: "Persona e público-alvo",
        description: "Defina quem é seu cliente ideal",
        type: "TEXT",
        content: "Conteúdo completo sobre personas e público-alvo...",
        sortOrder: 3,
        isPublished: true,
      },
      {
        moduleId: module2.id,
        title: "Keyword Research",
        description: "Como encontrar as melhores palavras-chave",
        type: "VIDEO",
        videoDuration: 3600,
        sortOrder: 1,
        isPublished: true,
      },
      {
        moduleId: module2.id,
        title: "Link Building em 2024",
        description: "Estratégias modernas de construção de links",
        type: "VIDEO",
        videoDuration: 2700,
        sortOrder: 2,
        isPublished: true,
      },
    ],
  });

  console.log("✅ Content created");

  // =============================================================================
  // LIVE SESSIONS
  // =============================================================================
  await db.liveSession.create({
    data: {
      communityId: community1.id,
      hostId: inf1User.id,
      title: "Masterclass: Google Ads 2024",
      description: "Aprenda a criar campanhas lucrativas no Google Ads",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      isRecorded: true,
    },
  });

  await db.liveSession.create({
    data: {
      communityId: community1.id,
      hostId: inf1User.id,
      title: "Sessão de Q&A — Tire suas dúvidas",
      description: "Sessão aberta para perguntas e respostas",
      status: "ENDED",
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      actualAttendees: 142,
      isRecorded: true,
    },
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
        sellerId: inf1User.id,
        title: "Pack de Templates para Instagram",
        slug: "pack-templates-instagram",
        description: "50 templates profissionais para Instagram Stories e Feed. Editáveis no Canva.",
        shortDesc: "50 templates profissionais para Instagram",
        type: "TEMPLATE",
        status: "ACTIVE",
        price: 47,
        currency: "brl",
        coverImageUrl: null,
        tags: ["instagram", "templates", "canva", "design"],
        categories: ["design", "marketing"],
        features: ["50 templates Stories", "30 templates Feed", "Editável no Canva", "Suporte por 30 dias"],
        isFeatured: true,
        totalSales: 127,
        averageRating: 4.8,
        reviewCount: 43,
      },
      {
        sellerId: inf2User.id,
        title: "Ebook: De 0 a 10k Seguidores em 90 dias",
        slug: "ebook-0-a-10k-seguidores",
        description: "Estratégia completa e comprovada para crescer organicamente no Instagram sem gastar com ads.",
        shortDesc: "Guia completo para crescimento orgânico",
        type: "EBOOK",
        status: "ACTIVE",
        price: 27,
        currency: "brl",
        tags: ["instagram", "seguidores", "crescimento", "organic"],
        categories: ["marketing", "redes-sociais"],
        features: ["150 páginas", "Exercícios práticos", "Templates bônus", "Acesso vitalício"],
        isFeatured: false,
        totalSales: 89,
        averageRating: 4.6,
        reviewCount: 31,
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

  // Create memberships (simulating active subscriptions)
  await db.communityMembership.createMany({
    data: [
      {
        userId: member1.id,
        communityId: community1.id,
        planId: plan1Pro.id,
        status: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: member2.id,
        communityId: community1.id,
        planId: plan1Basic.id,
        status: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Sync member counts
  await db.community.update({
    where: { id: community1.id },
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
  // PLATFORM PLAN
  // =============================================================================
  await db.platformPlan.create({
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

  console.log("✅ Platform plan created");

  console.log(`
╔═══════════════════════════════════════════════╗
║           SEED COMPLETED SUCCESSFULLY          ║
╠═══════════════════════════════════════════════╣
║ SuperAdmin    admin@comunidadehub.com          ║
║ Password      Admin@123456!                    ║
╠═══════════════════════════════════════════════╣
║ Influencer 1  joao@comunidade.com              ║
║ Influencer 2  ana@comunidade.com               ║
║ Password      Influencer@123!                  ║
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
