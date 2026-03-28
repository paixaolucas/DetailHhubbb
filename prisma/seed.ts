// =============================================================================
// DATABASE SEED
// Creates realistic test data for all platform entities
// =============================================================================

import { PrismaClient, UserRole, CommissionType, SaaSToolCategory, EventType, EventStatus, PostType, PaymentStatus, PaymentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Brazilian demo names
const FIRST_NAMES = [
  "João", "Carlos", "Pedro", "Lucas", "Mateus", "Gabriel", "Rafael", "Bruno",
  "Felipe", "Gustavo", "Diego", "André", "Igor", "Thiago", "Rodrigo", "Daniel",
  "Caio", "Vitor", "Henrique", "Eduardo", "Marcelo", "Roberto", "Paulo", "Fernando",
  "Ricardo", "Alexandre", "Leandro", "Fábio", "Renato", "Sérgio",
  "Ana", "Maria", "Julia", "Fernanda", "Beatriz", "Camila", "Larissa", "Tatiane",
  "Patricia", "Amanda", "Vanessa", "Priscila", "Aline", "Gabriela", "Mariana",
  "Leticia", "Natalia", "Juliana", "Claudia", "Simone",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Costa", "Ferreira", "Pereira", "Lima",
  "Carvalho", "Alves", "Rocha", "Martins", "Araújo", "Gomes", "Rodrigues", "Nunes",
  "Mendes", "Castro", "Ribeiro", "Teixeira",
];

async function main() {
  console.log("🌱 Seeding database...");

  // =============================================================================
  // CLEAN UP (development only)
  // =============================================================================
  // Sequential deletes (pgBouncer pooler doesn't support multi-query $transaction)
  await db.aIUsageLog.deleteMany();
  await db.analyticsEvent.deleteMany();
  await db.contentProgress.deleteMany();
  await db.liveSessionAttendee.deleteMany();
  await db.liveSession.deleteMany();
  await db.contentLesson.deleteMany();
  await db.contentModule.deleteMany();
  await db.commissionTransaction.deleteMany();
  await db.commissionRule.deleteMany();
  await db.payment.deleteMany();
  await db.communityOptIn.deleteMany();
  await db.communityMembership.deleteMany();
  await db.platformMembership.deleteMany();
  await db.platformPlan.deleteMany();
  await db.subscriptionPlan.deleteMany();
  await db.eventRegistration.deleteMany();
  await db.eventTicketType.deleteMany();
  await db.event.deleteMany();
  await db.postReaction.deleteMany();
  await db.commentReaction.deleteMany();
  await db.comment.deleteMany();
  await db.post.deleteMany();
  await db.space.deleteMany();
  await db.pointTransaction.deleteMany();
  await db.userPoints.deleteMany();
  await db.userBadge.deleteMany();
  await db.badge.deleteMany();
  await db.certificate.deleteMany();
  await db.community.deleteMany();
  await db.influencer.deleteMany();
  await db.refreshToken.deleteMany();
  await db.marketplacePurchase.deleteMany();
  await db.marketplaceListing.deleteMany();
  await db.saasTool.deleteMany();
  await db.notification.deleteMany();
  await db.directMessage.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
  await db.user.deleteMany();

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
      emailVerified: new Date(),
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
      emailVerified: new Date(),
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
      emailVerified: new Date(),
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
      emailVerified: new Date(),
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
      totalEarnings: 18968,
      pendingPayout: 2500,
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
      totalEarnings: 18968,
      pendingPayout: 2500,
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
      totalEarnings: 18968,
      pendingPayout: 2500,
    },
  });

  const gimenezUser = await db.user.create({
    data: {
      email: "gimenez@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Gimenez",
      lastName: "Oficial",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "GIMENEZ001",
    },
  });

  const gigiUser = await db.user.create({
    data: {
      email: "gigi@comunidade.com",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "Gigi",
      lastName: "Oficial",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "GIGI001",
    },
  });

  const influencerGimenez = await db.influencer.create({
    data: {
      userId: gimenezUser.id,
      displayName: "Gimenez",
      bio: "Apaixonado por carros e pelo universo automotivo. Na Garagem do Gimenez a gente transforma paixão em conteúdo de verdade.",
      isVerified: true,
      totalEarnings: 18968,
      pendingPayout: 2500,
    },
  });

  const influencerGigi = await db.influencer.create({
    data: {
      userId: gigiUser.id,
      displayName: "Gigi",
      bio: "Estética automotiva com estilo e precisão. Na Sala do Gigi cada detalhe importa.",
      isVerified: true,
      totalEarnings: 18968,
      pendingPayout: 2500,
    },
  });

  // ── Platform Academy influencer (SUPER_ADMIN owns the academy community) ──────
  // We create a separate influencer user for the platform to host the Academy
  const academyUser = await db.user.create({
    data: {
      email: "academy@detailerhub.com.br",
      passwordHash: await bcrypt.hash("Influencer@123!", saltRounds),
      firstName: "DetailerHUB",
      lastName: "Academy",
      role: UserRole.INFLUENCER_ADMIN,
      referralCode: "ACADEMY001",
      emailVerified: new Date(),
    },
  });

  const influencerAcademy = await db.influencer.create({
    data: {
      userId: academyUser.id,
      displayName: "DetailerHUB Academy",
      bio: "Conteúdo oficial da plataforma: precificação, comunicação e captação de clientes. Módulos produzidos pela equipe DetailerHUB.",
      isVerified: true,
      isActive: true,
      totalEarnings: 0,
      pendingPayout: 0,
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
      memberCount: 350,
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
      memberCount: 350,
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
      memberCount: 350,
      welcomeMessage:
        "Bem-vindo à Comunidade no Mel! Aqui você vai encontrar aulas, técnicas e uma galera apaixonada por estética automotiva. Bora aprender!",
      rules:
        "1. Respeite todos os membros\n2. Compartilhe suas dúvidas e resultados\n3. Sem spam ou conteúdo off-topic\n4. Ajude quem está começando\n5. Aproveite o conteúdo ao máximo",
      tags: ["estetica-automotiva", "aulas", "detailing", "polimento", "no-mel", "neto"],
    },
  });

  const communityGimenez = await db.community.create({
    data: {
      influencerId: influencerGimenez.id,
      name: "Garagem do Gimenez",
      slug: "garagem-do-gimenez",
      shortDescription: "A garagem do Gimenez — onde a paixão por carros vira conteúdo.",
      primaryColor: "#C0392B",
      bannerUrl: null,
      logoUrl: null,
      isPublished: true,
      isPrivate: false,
      memberCount: 350,
    },
  });

  const communityGigi = await db.community.create({
    data: {
      influencerId: influencerGigi.id,
      name: "Sala do Gigi",
      slug: "sala-do-gigi",
      shortDescription: "A sala do Gigi — estética automotiva com estilo e precisão.",
      primaryColor: "#8E44AD",
      bannerUrl: null,
      logoUrl: null,
      isPublished: true,
      isPrivate: false,
      memberCount: 350,
    },
  });

  const communityAcademy = await db.community.create({
    data: {
      influencerId: influencerAcademy.id,
      name: "DetailerHUB Academy",
      slug: "academy",
      description:
        "O conteúdo oficial da plataforma. Precificação estratégica, comunicação com o cliente, captação e retenção — produzido pela equipe DetailerHUB para transformar detailers em empresários.",
      shortDescription: "Módulos da plataforma: do técnico ao empresarial.",
      primaryColor: "#006079",
      secondaryColor: "#009CD9",
      accentColor: "#EEE6E4",
      isPublished: true,
      isPrivate: false,
      memberCount: 0,
      welcomeMessage:
        "Bem-vindo à DetailerHUB Academy! Aqui você encontra os módulos produzidos pela plataforma: precificação estratégica, comunicação com o cliente, captação e muito mais. É o conteúdo que transforma detailers em empresários.",
      rules: "1. Consuma o conteúdo com foco na aplicação\n2. Compartilhe seus resultados e dúvidas\n3. Respeite todos os membros",
      tags: ["precificacao", "negocios", "detailing", "academy", "detailerhub"],
    },
  });

  console.log("✅ Communities created");

  // =============================================================================
  // SUBSCRIPTION PLANS (legacy — required for CommunityMembership FK)
  // =============================================================================
  const planBarba = await db.subscriptionPlan.create({
    data: {
      communityId: communityBarba.id,
      name: "Membro Barba",
      price: 0,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      isActive: true,
      features: ["Acesso ao feed", "Lives", "Conteúdo exclusivo"],
    },
  });

  const planCorujao = await db.subscriptionPlan.create({
    data: {
      communityId: communityCorujao.id,
      name: "Membro Corujão",
      price: 0,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      isActive: true,
      features: ["Acesso ao feed", "Lives", "Conteúdo exclusivo"],
    },
  });

  const planNoMel = await db.subscriptionPlan.create({
    data: {
      communityId: communityNoMel.id,
      name: "Membro No Mel",
      price: 0,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      isActive: true,
      features: ["Acesso ao feed", "Lives", "Aulas completas"],
    },
  });

  const planGimenez = await db.subscriptionPlan.create({
    data: {
      communityId: communityGimenez.id,
      name: "Membro Garagem",
      price: 0,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      isActive: true,
      features: ["Acesso ao feed", "Lives", "Conteúdo exclusivo"],
    },
  });

  const planGigi = await db.subscriptionPlan.create({
    data: {
      communityId: communityGigi.id,
      name: "Membro Sala",
      price: 0,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      isDefault: true,
      isActive: true,
      features: ["Acesso ao feed", "Lives", "Conteúdo exclusivo"],
    },
  });

  // =============================================================================
  // SPACES
  // =============================================================================

  // Barba spaces (max 3)
  await db.space.createMany({
    data: [
      { communityId: communityBarba.id, name: "Feed Geral", slug: "feed", description: "O coração da comunidade.", icon: "🔥", type: "DISCUSSION", sortOrder: 1, isDefault: true },
      { communityId: communityBarba.id, name: "Tira-Dúvidas", slug: "tira-duvidas", description: "Pergunta sem medo.", icon: "❓", type: "QA", sortOrder: 2 },
      { communityId: communityBarba.id, name: "Avisos", slug: "avisos", description: "Comunicados oficiais.", icon: "📢", type: "ANNOUNCEMENT", sortOrder: 3 },
    ],
  });

  // Corujão spaces (max 3)
  await db.space.createMany({
    data: [
      { communityId: communityCorujao.id, name: "Feed", slug: "feed", description: "Tudo rola aqui.", icon: "🦉", type: "DISCUSSION", sortOrder: 1, isDefault: true },
      { communityId: communityCorujao.id, name: "Tira-Dúvidas", slug: "tira-duvidas", description: "Pergunta à comunidade.", icon: "❓", type: "QA", sortOrder: 2 },
      { communityId: communityCorujao.id, name: "Avisos", slug: "avisos", description: "Comunicados do Corujão.", icon: "📢", type: "ANNOUNCEMENT", sortOrder: 3 },
    ],
  });

  // No Mel spaces (max 3)
  await db.space.createMany({
    data: [
      { communityId: communityNoMel.id, name: "Feed", slug: "feed", description: "Atualizações e novidades.", icon: "🍯", type: "DISCUSSION", sortOrder: 1, isDefault: true },
      { communityId: communityNoMel.id, name: "Tira-Dúvidas", slug: "tira-duvidas", description: "Sua dúvida tem resposta.", icon: "❓", type: "QA", sortOrder: 2 },
      { communityId: communityNoMel.id, name: "Avisos", slug: "avisos", description: "Comunicados oficiais.", icon: "📢", type: "ANNOUNCEMENT", sortOrder: 3 },
    ],
  });

  // Gimenez spaces
  await db.space.createMany({
    data: [
      { communityId: communityGimenez.id, name: "Feed", slug: "feed", description: "Tudo sobre carros aqui.", icon: "🚗", type: "DISCUSSION", sortOrder: 1, isDefault: true },
      { communityId: communityGimenez.id, name: "Tira-Dúvidas", slug: "tira-duvidas", description: "Pergunta sem medo.", icon: "❓", type: "QA", sortOrder: 2 },
      { communityId: communityGimenez.id, name: "Avisos", slug: "avisos", description: "Comunicados oficiais.", icon: "📢", type: "ANNOUNCEMENT", sortOrder: 3 },
    ],
  });

  // Gigi spaces
  await db.space.createMany({
    data: [
      { communityId: communityGigi.id, name: "Feed", slug: "feed", description: "Novidades e conteúdo.", icon: "✨", type: "DISCUSSION", sortOrder: 1, isDefault: true },
      { communityId: communityGigi.id, name: "Tira-Dúvidas", slug: "tira-duvidas", description: "Pergunta sem medo.", icon: "❓", type: "QA", sortOrder: 2 },
      { communityId: communityGigi.id, name: "Avisos", slug: "avisos", description: "Comunicados oficiais.", icon: "📢", type: "ANNOUNCEMENT", sortOrder: 3 },
    ],
  });

  const spacesBarba = await db.space.findMany({ where: { communityId: communityBarba.id }, orderBy: { sortOrder: "asc" } });
  const spacesCorujao = await db.space.findMany({ where: { communityId: communityCorujao.id }, orderBy: { sortOrder: "asc" } });
  const spacesNoMel = await db.space.findMany({ where: { communityId: communityNoMel.id }, orderBy: { sortOrder: "asc" } });

  console.log("✅ Spaces created");

  // =============================================================================
  // COMMISSION RULES
  // =============================================================================
  await db.commissionRule.createMany({
    data: [
      { communityId: communityBarba.id, name: "Comissão padrão", description: "70% para o Barba, 10% de taxa de plataforma", type: CommissionType.PERCENTAGE, rate: 0.7, platformFee: 0.1, isActive: true },
      { communityId: communityCorujao.id, name: "Comissão padrão", description: "70% para o Corujão, 10% de taxa de plataforma", type: CommissionType.PERCENTAGE, rate: 0.7, platformFee: 0.1, isActive: true },
      { communityId: communityNoMel.id, name: "Comissão padrão", description: "75% para o Neto, 10% de taxa de plataforma", type: CommissionType.PERCENTAGE, rate: 0.75, platformFee: 0.1, isActive: true },
    ],
  });
  console.log("✅ Commission rules created");

  // =============================================================================
  // CONTENT MODULES & LESSONS
  // =============================================================================
  const moduloBarba1 = await db.contentModule.create({ data: { communityId: communityBarba.id, title: "Fundamentos da Estética Automotiva", description: "Os pilares que todo detailer precisa dominar", sortOrder: 1, isPublished: true } });
  const moduloBarba2 = await db.contentModule.create({ data: { communityId: communityBarba.id, title: "Polimento Profissional", description: "Correção de pintura do básico ao avançado", sortOrder: 2, isPublished: true, unlockAfterDays: 7 } });
  const moduloBarba3 = await db.contentModule.create({ data: { communityId: communityBarba.id, title: "PPF e Vitrificação", description: "Proteção premium — PPF, nano cerâmica e mais", sortOrder: 3, isPublished: true, unlockAfterDays: 14 } });

  await db.contentLesson.createMany({
    data: [
      { moduleId: moduloBarba1.id, title: "O que é estética automotiva de verdade?", description: "Separando o que importa do pink lemonade", type: "VIDEO", videoDuration: 1800, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: moduloBarba1.id, title: "Entendendo a tinta do carro", description: "Camadas, tipos e como cada uma reage ao polimento", type: "VIDEO", videoDuration: 2400, sortOrder: 2, isPublished: true },
      { moduleId: moduloBarba1.id, title: "Guia de produtos essenciais", description: "O que você precisa ter (e o que é enganação)", type: "TEXT", sortOrder: 3, isPublished: true },
      { moduleId: moduloBarba1.id, title: "Lavagem correta: do pré-lavagem ao secado", description: "Como preparar a superfície sem agredir a pintura", type: "VIDEO", videoDuration: 2100, sortOrder: 4, isPublished: true },
      { moduleId: moduloBarba2.id, title: "Máquinas de polimento — qual escolher?", description: "Roto-orbital, dual action, elétrica ou pneumática", type: "VIDEO", videoDuration: 3200, sortOrder: 1, isPublished: true },
      { moduleId: moduloBarba2.id, title: "Correção de pintura passo a passo", description: "Do clay bar ao polish final", type: "VIDEO", videoDuration: 4500, sortOrder: 2, isPublished: true },
      { moduleId: moduloBarba2.id, title: "Acabamento espelho: técnica e prática", description: "Como atingir o acabamento espelho em qualquer cor", type: "VIDEO", videoDuration: 3800, sortOrder: 3, isPublished: true },
      { moduleId: moduloBarba3.id, title: "O que é PPF e quando usar", description: "Película de proteção pintada — tudo que você precisa saber", type: "VIDEO", videoDuration: 2700, sortOrder: 1, isPublished: true },
      { moduleId: moduloBarba3.id, title: "Vitrificação nano cerâmica", description: "Aplicação, cura e durabilidade real", type: "VIDEO", videoDuration: 3400, sortOrder: 2, isPublished: true },
    ],
  });

  const moduloNeto1 = await db.contentModule.create({ data: { communityId: communityNoMel.id, title: "Fundamentos", description: "Estética automotiva do zero.", sortOrder: 1, isPublished: true } });
  const moduloNeto2 = await db.contentModule.create({ data: { communityId: communityNoMel.id, title: "Técnicas Intermediárias", description: "Suba de nível.", sortOrder: 2, isPublished: true, unlockAfterDays: 14 } });
  const moduloNeto3 = await db.contentModule.create({ data: { communityId: communityNoMel.id, title: "Especialização", description: "Para quem quer ir além.", sortOrder: 3, isPublished: true, unlockAfterDays: 30 } });

  await db.contentLesson.createMany({
    data: [
      { moduleId: moduloNeto1.id, title: "Aula 01 — O que é estética automotiva?", description: "Introdução completa: conceitos, mercado e oportunidades", type: "VIDEO", videoDuration: 2100, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: moduloNeto1.id, title: "Aula 02 — Lavagem e descontaminação", description: "Como lavar certo e preparar a superfície", type: "VIDEO", videoDuration: 2700, sortOrder: 2, isPublished: true },
      { moduleId: moduloNeto1.id, title: "Aula 03 — Produtos e ferramentas básicas", description: "Kit inicial: o que comprar e por quê", type: "VIDEO", videoDuration: 1900, sortOrder: 3, isPublished: true },
      { moduleId: moduloNeto1.id, title: "Aula 04 — Segurança no trabalho", description: "EPI, ventilação e boas práticas", type: "TEXT", sortOrder: 4, isPublished: true },
      { moduleId: moduloNeto2.id, title: "Aula 05 — Polimento: correção de pintura", description: "Técnica completa com máquina dual action", type: "VIDEO", videoDuration: 5400, sortOrder: 1, isPublished: true },
      { moduleId: moduloNeto2.id, title: "Aula 06 — Vitrificação e proteção", description: "Cerâmica, cera e PPF — quando usar cada um", type: "VIDEO", videoDuration: 3600, sortOrder: 2, isPublished: true },
      { moduleId: moduloNeto2.id, title: "Aula 07 — Higienização interna completa", description: "Interior, couro, teto solar e mais", type: "VIDEO", videoDuration: 2900, sortOrder: 3, isPublished: true },
      { moduleId: moduloNeto3.id, title: "Aula 08 — Precificação e gestão do negócio", description: "Como cobrar certo e lucrar de verdade", type: "VIDEO", videoDuration: 4100, sortOrder: 1, isPublished: true },
      { moduleId: moduloNeto3.id, title: "Aula 09 — Captação e retenção de clientes", description: "Estratégias para construir carteira de clientes fiel", type: "VIDEO", videoDuration: 3700, sortOrder: 2, isPublished: true },
    ],
  });

  // =============================================================================
  // 7 MÓDULOS ESTRUTURADOS — DetailerHUB Academy
  // Fonte: branding/Novos arquivos e documentações/operacional/pautas-de-conteudo.md
  // Módulos 1–4: conteúdo técnico (gravado por produtores de conteúdo externos)
  // Módulos 5–7: conteúdo da plataforma (produzido internamente)
  // =============================================================================

  const mod1 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 1 — Ceramic Coating do Zero ao Acabamento Profissional", description: "O membro aprende a executar ceramic coating com confiança técnica suficiente para cobrar por isso — incluindo os erros que fazem o serviço ficar ruim e como evitá-los.", sortOrder: 1, isPublished: true } });
  const mod2 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 2 — Correção de Pintura Profissional", description: "O membro aprende a realizar correção de pintura em níveis 1, 2 e 3 — com controle técnico do processo e capacidade de orçar corretamente.", sortOrder: 2, isPublished: true } });
  const mod3 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 3 — PPF: Instalação e Gestão do Serviço", description: "O membro entende o serviço de PPF o suficiente para orçar, vender e gerenciar terceiros — ou para começar a instalar em casos simples.", sortOrder: 3, isPublished: true } });
  const mod4 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 4 — Higienização Técnica Avançada", description: "Transformar higienização — muitas vezes vendida como 'lavagem cara' — em serviço técnico com ticket 3–5x maior e resultado documentável.", sortOrder: 4, isPublished: true } });
  const mod5 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 5 — Precificação Estratégica", description: "Planilhas, templates e vídeos para calcular o preço real dos seus serviços e nunca mais trabalhar no prejuízo.", sortOrder: 5, isPublished: true, unlockAfterDays: 0 } });
  const mod6 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 6 — Comunicação e Atração de Clientes", description: "Como fotografar, descrever e comunicar seus serviços para atrair o cliente de maior ticket.", sortOrder: 6, isPublished: false } });
  const mod7 = await db.contentModule.create({ data: { communityId: communityAcademy.id, title: "Módulo 7 — Captação e Retenção de Clientes", description: "Estratégias para construir uma carteira de clientes fiel e gerar renda recorrente.", sortOrder: 7, isPublished: false } });

  await db.contentLesson.createMany({
    data: [
      // Módulo 1 — Ceramic Coating
      { moduleId: mod1.id, title: "Aula 1.1 — Preparação de Superfície: o que 90% erra antes de abrir o frasco", description: "Leitura de espessura, descontaminação, correção mínima e checklist de preparação.", type: "VIDEO", videoDuration: 18 * 60, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: mod1.id, title: "Aula 1.2 — Aplicação do Ceramic Coating: técnica de linha cruzada e controle de flash time", description: "Técnica de aplicação, flash time visual, remoção do excesso e high spots.", type: "VIDEO", videoDuration: 22 * 60, sortOrder: 2, isPublished: true },
      { moduleId: mod1.id, title: "Aula 1.3 — Cura, Manutenção e Entrega para o Cliente", description: "Período de cura, roteiro de entrega, fotografia do resultado e como cobrar.", type: "VIDEO", videoDuration: 17 * 60, sortOrder: 3, isPublished: true },
      { moduleId: mod1.id, title: "Aula 1.4 — Precificação do Ceramic Coating: custo real e preço mínimo", description: "Todos os custos esquecidos, calculando com a planilha, preço mínimo vs. mercado.", type: "VIDEO", videoDuration: 14 * 60, sortOrder: 4, isPublished: true },
      // Módulo 2 — Correção de Pintura
      { moduleId: mod2.id, title: "Aula 2.1 — Leitura de Pintura: o que o cliente não vê mas você precisa ver", description: "Identificação de imperfeições, espessura, classificação de nível e documentação fotográfica.", type: "VIDEO", videoDuration: 15 * 60, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: mod2.id, title: "Aula 2.2 — Polimento de Nível 1: remoção de swirls e microriscos leves", description: "Escolha de combo, técnica de prime, velocidade/pressão/sobreposição e validação do resultado.", type: "VIDEO", videoDuration: 20 * 60, sortOrder: 2, isPublished: true },
      { moduleId: mod2.id, title: "Aula 2.3 — Polimento de Nível 2 e 3: quando o DA não resolve", description: "Uso de rotativa, correção de oxidação, limite seguro de passes e refinamento pós-corte.", type: "VIDEO", videoDuration: 22 * 60, sortOrder: 3, isPublished: true },
      // Módulo 3 — PPF
      { moduleId: mod3.id, title: "Aula 3.1 — O que é PPF e como vender antes de instalar", description: "PPF vs. vinil vs. ceramic, tipos de cobertura, roteiro de venda e precificação.", type: "VIDEO", videoDuration: 15 * 60, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: mod3.id, title: "Aula 3.2 — Instalação de Kit Básico: portas, maçanetas e para-choque", description: "Preparação de superfície, aplicação molhada, bordas e entrega ao cliente.", type: "VIDEO", videoDuration: 25 * 60, sortOrder: 2, isPublished: true },
      // Módulo 4 — Higienização
      { moduleId: mod4.id, title: "Aula 4.1 — Higienização de Estofados: a diferença entre limpo e higienizado", description: "Luz UV, tipos de estofado, extração em tecido, couro, ozonização.", type: "VIDEO", videoDuration: 18 * 60, sortOrder: 1, isPublished: true, isFree: true },
      { moduleId: mod4.id, title: "Aula 4.2 — Higienização de Motor: serviço com alto ticket e baixo risco quando feito certo", description: "O que proteger, desengraxante, enxágue controlado, secagem e acabamento.", type: "VIDEO", videoDuration: 15 * 60, sortOrder: 2, isPublished: true },
      // Módulo 5 — Precificação (plataforma)
      { moduleId: mod5.id, title: "Aula 5.1 — Por que você cobra menos do que deveria", description: "O custo real de uma hora de trabalho, todos os custos esquecidos e preço mínimo vs. mercado.", type: "VIDEO", videoDuration: 12 * 60, sortOrder: 1, isPublished: true, isFree: true, attachments: JSON.stringify([{ name: "Planilha de Custo Real por Serviço", type: "spreadsheet" }]) },
      { moduleId: mod5.id, title: "Aula 5.2 — Montando sua Tabela de Preços", description: "Três colunas de preço, porte do carro como variável, apresentação ao cliente e resposta ao 'está caro'.", type: "VIDEO", videoDuration: 15 * 60, sortOrder: 2, isPublished: true, attachments: JSON.stringify([{ name: "Template de Tabela de Preços por Serviço", type: "template" }]) },
      { moduleId: mod5.id, title: "Aula 5.3 — O Orçamento que Fecha", description: "Por que orçamento escrito fecha mais, o modelo DetailerHUB e termos que protegem você.", type: "VIDEO", videoDuration: 12 * 60, sortOrder: 3, isPublished: true, attachments: JSON.stringify([{ name: "Template de Orçamento Profissional", type: "template" }]) },
      // Módulo 6 — Comunicação (plataforma — não publicado ainda)
      { moduleId: mod6.id, title: "Aula 6.1 — A Foto que Vende o Serviço", description: "Luz certa, ângulos que valorizam, antes e depois perfeito.", type: "VIDEO", videoDuration: 10 * 60, sortOrder: 1, isPublished: false },
      { moduleId: mod6.id, title: "Aula 6.2 — O que postar e como descrever o serviço", description: "Estrutura do post que atrai, vocabulário do cliente premium, stories vs. feed.", type: "VIDEO", videoDuration: 10 * 60, sortOrder: 2, isPublished: false },
      // Módulo 7 — Captação (plataforma — não publicado ainda)
      { moduleId: mod7.id, title: "Aula 7.1 — Como construir carteira de clientes do zero", description: "Estratégias de captação, indicações e posicionamento de autoridade.", type: "VIDEO", videoDuration: 15 * 60, sortOrder: 1, isPublished: false },
      { moduleId: mod7.id, title: "Aula 7.2 — Retenção: como fazer o cliente voltar sempre", description: "Follow-up, programa de fidelidade, agendamento recorrente.", type: "VIDEO", videoDuration: 12 * 60, sortOrder: 2, isPublished: false },
    ],
  });

  console.log("✅ 7 Academy modules and lessons created");

  console.log("✅ Content modules and lessons created");

  // =============================================================================
  // LIVE SESSIONS
  // =============================================================================
  await db.liveSession.createMany({
    data: [
      { communityId: communityBarba.id, hostId: barbaUser.id, title: "Queimando Mitos: Os maiores erros no polimento", description: "Ao vivo com o Barba desmontando os mitos mais perigosos", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3 * 86400000), isRecorded: true },
      { communityId: communityBarba.id, hostId: barbaUser.id, title: "Tira-Dúvidas ao Vivo — Polimento e Proteção", status: "ENDED", scheduledAt: new Date(Date.now() - 7 * 86400000), startedAt: new Date(Date.now() - 7 * 86400000), endedAt: new Date(Date.now() - 7 * 86400000 + 90 * 60000), actualAttendees: 318, isRecorded: true },
      { communityId: communityBarba.id, hostId: barbaUser.id, title: "Workshop de Correção de Pintura AO VIVO", status: "ENDED", scheduledAt: new Date(Date.now() - 21 * 86400000), startedAt: new Date(Date.now() - 21 * 86400000), endedAt: new Date(Date.now() - 21 * 86400000 + 120 * 60000), actualAttendees: 427, isRecorded: true },
      { communityId: communityCorujao.id, hostId: corujaoUser.id, title: "É Zika! — Live da Rua", description: "Corujão ao vivo direto da rua.", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 5 * 86400000), isRecorded: true },
      { communityId: communityCorujao.id, hostId: corujaoUser.id, title: "Live Especial: Meet & Greet Virtual", status: "ENDED", scheduledAt: new Date(Date.now() - 14 * 86400000), startedAt: new Date(Date.now() - 14 * 86400000), endedAt: new Date(Date.now() - 14 * 86400000 + 75 * 60000), actualAttendees: 256, isRecorded: true },
      { communityId: communityNoMel.id, hostId: netoUser.id, title: "Aula ao Vivo: Correção de Pintura na Prática", description: "O Neto demonstrando correção de pintura em tempo real", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 2 * 86400000), isRecorded: true },
      { communityId: communityNoMel.id, hostId: netoUser.id, title: "Aula ao Vivo: Cerâmica de Última Geração", status: "ENDED", scheduledAt: new Date(Date.now() - 10 * 86400000), startedAt: new Date(Date.now() - 10 * 86400000), endedAt: new Date(Date.now() - 10 * 86400000 + 105 * 60000), actualAttendees: 389, isRecorded: true },
    ],
  });
  console.log("✅ Live sessions created");

  // =============================================================================
  // PLATFORM PLAN
  // =============================================================================
  const platformPlan = await db.platformPlan.create({
    data: {
      name: "DetailHub Anual",
      description: "Acesso completo a todas as comunidades automotivas da plataforma.",
      price: 708,
      currency: "brl",
      interval: "year",
      intervalCount: 1,
      trialDays: 0,
      features: ["Acesso a todas as comunidades", "Conteúdo ilimitado", "Lives & streaming", "Marketplace", "Auto AI", "Leaderboard e badges"],
      isActive: true,
    },
  });

  const platformPlanMonthly = await db.platformPlan.create({
    data: {
      name: "DetailHub Mensal (PIX)",
      description: "Acesso completo a todas as comunidades. Cobrança mensal via PIX ou cartão recorrente.",
      price: 79,
      currency: "brl",
      interval: "month",
      intervalCount: 1,
      trialDays: 0,
      features: ["Acesso a todas as comunidades", "Conteúdo ilimitado", "Lives & streaming", "Marketplace", "Auto AI"],
      isActive: true,
    },
  });

  // =============================================================================
  // 350 DEMO MEMBERS + PLATFORM MEMBERSHIPS
  // 70 per influencer × 5 influencers = 350 total
  // Mix: every 5th member is monthly PIX (R$79), rest annual (R$708)
  // All memberships have currentPeriodEnd in the future
  // =============================================================================
  console.log("🔄 Creating 350 demo members...");
  const memberPassword = await bcrypt.hash("Membro@123!", 8); // 8 rounds for seeding speed

  await db.user.createMany({
    data: Array.from({ length: 350 }, (_, i) => ({
      email: `demo${i + 1}@detailhub.com`,
      passwordHash: memberPassword,
      firstName: FIRST_NAMES[i % FIRST_NAMES.length],
      lastName: LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length],
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: `DEMO${String(i + 1).padStart(5, "0")}`,
    })),
  });

  const demoMembers = await db.user.findMany({
    where: { email: { contains: "@detailhub.com" } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();

  // Distribute referrals: 70 per influencer (Barba, Corujão, Neto, Gimenez, Gigi)
  // joinedAt spread over last 6 months per block; monthly members' end = 1 month from NOW (always valid)
  await db.platformMembership.createMany({
    data: demoMembers.map((member, i) => {
      const referredByInfluencerId =
        i < 70  ? influencerBarba.id    :
        i < 140 ? influencerCorujao.id  :
        i < 210 ? influencerNeto.id     :
        i < 280 ? influencerGimenez.id  :
                  influencerGigi.id;

      // Every 5th member is monthly PIX, rest annual
      const isMonthly = i % 5 === 0;
      const planId = isMonthly ? platformPlanMonthly.id : platformPlan.id;

      // Spread joinedAt over last 6 months within each 70-member block
      const localIndex = i % 70;
      const monthOffset = Math.floor((localIndex / 70) * 6); // 0..5
      const dayOffset = (localIndex % 28) + 1;
      const joinedAt = new Date(now.getFullYear(), now.getMonth() - 5 + monthOffset, dayOffset);

      return {
        userId: member.id,
        planId,
        status: "ACTIVE" as const,
        currentPeriodStart: joinedAt,
        // Monthly: always 1 month from NOW (never expired); Annual: 1 year from join date
        currentPeriodEnd: isMonthly
          ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
          : new Date(joinedAt.getFullYear() + 1, joinedAt.getMonth(), joinedAt.getDate()),
        referredByInfluencerId,
        joinedAt,
      };
    }),
  });

  console.log("✅ 350 demo members + platform memberships created");

  // =============================================================================
  // 2 NAMED TEST MEMBERS (for manual login testing)
  // =============================================================================
  const member1 = await db.user.create({
    data: {
      email: "membro1@email.com",
      passwordHash: await bcrypt.hash("Membro@123!", saltRounds),
      firstName: "Carlos",
      lastName: "Oliveira",
      role: UserRole.COMMUNITY_MEMBER,
      referralCode: "CARLOS001",
      emailVerified: new Date(),
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

  await db.platformMembership.createMany({
    data: [
      { userId: member1.id, planId: platformPlan.id, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365 * 86400000), referredByInfluencerId: influencerBarba.id, joinedAt: new Date(Date.now() - 5 * 86400000) },
      { userId: member2.id, planId: platformPlan.id, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365 * 86400000), referredByInfluencerId: influencerCorujao.id, joinedAt: new Date(Date.now() - 3 * 86400000) },
    ],
  });

  // =============================================================================
  // PLATFORM PAYMENTS — create SUCCEEDED payment per platform membership
  // Enables the "Pagamentos Recentes" tab to show data for each influencer
  // =============================================================================
  console.log("🔄 Creating platform payments...");

  const allPlatformMemberships = await db.platformMembership.findMany({
    select: {
      id: true,
      userId: true,
      joinedAt: true,
      plan: { select: { interval: true, price: true } },
    },
  });

  await db.payment.createMany({
    data: allPlatformMemberships.map((m) => ({
      userId: m.userId,
      platformMembershipId: m.id,
      amount: Number(m.plan.price),
      currency: "brl",
      status: PaymentStatus.SUCCEEDED,
      type: PaymentType.SUBSCRIPTION,
      description: m.plan.interval === "year" ? "DetailHub Anual" : "DetailHub Mensal (PIX)",
      createdAt: m.joinedAt,
    })),
  });

  console.log(`✅ ${allPlatformMemberships.length} platform payments created`);

  // =============================================================================
  // COMMUNITY MEMBERSHIPS (visible in community settings > Members tab)
  // 70 demo members per community (one block per influencer) + named test members
  // =============================================================================
  const barbaMembers    = demoMembers.slice(0, 70);
  const corujaoMembers  = demoMembers.slice(70, 140);
  const netoMembers     = demoMembers.slice(140, 210);
  const gimenezMembers  = demoMembers.slice(210, 280);
  const gigiMembers     = demoMembers.slice(280, 350);

  const makeMemberships = (
    members: { id: string }[],
    communityId: string,
    planId: string,
  ) => members.map((m, i) => ({
    userId: m.id,
    communityId,
    planId,
    status: "ACTIVE" as const,
    subscriptionStatus: "ACTIVE" as const,
    joinedAt: new Date(now.getFullYear(), now.getMonth() - Math.floor(i / 10), (i % 28) + 1),
  }));

  await db.communityMembership.createMany({
    data: [
      ...makeMemberships(barbaMembers, communityBarba.id, planBarba.id),
      { userId: member1.id, communityId: communityBarba.id, planId: planBarba.id, status: "ACTIVE", subscriptionStatus: "ACTIVE", joinedAt: new Date(Date.now() - 5 * 86400000) },
      ...makeMemberships(corujaoMembers, communityCorujao.id, planCorujao.id),
      { userId: member2.id, communityId: communityCorujao.id, planId: planCorujao.id, status: "ACTIVE", subscriptionStatus: "ACTIVE", joinedAt: new Date(Date.now() - 3 * 86400000) },
      ...makeMemberships(netoMembers, communityNoMel.id, planNoMel.id),
      ...makeMemberships(gimenezMembers, communityGimenez.id, planGimenez.id),
      ...makeMemberships(gigiMembers, communityGigi.id, planGigi.id),
    ],
  });

  console.log("✅ Community memberships created (70 per community)");

  // =============================================================================
  // COMMUNITY OPT-INS — needed for sidebar nav and MiniRankingCard
  // Each member opts into their primary community
  // =============================================================================
  const makeOptIns = (members: { id: string }[], communityId: string) =>
    members.map((m) => ({ userId: m.id, communityId, joinedAt: new Date() }));

  await db.communityOptIn.createMany({
    data: [
      { userId: member1.id, communityId: communityBarba.id, joinedAt: new Date() },
      { userId: member1.id, communityId: communityCorujao.id, joinedAt: new Date() },
      { userId: member2.id, communityId: communityCorujao.id, joinedAt: new Date() },
      { userId: member2.id, communityId: communityNoMel.id, joinedAt: new Date() },
      ...makeOptIns(barbaMembers, communityBarba.id),
      ...makeOptIns(corujaoMembers, communityCorujao.id),
      ...makeOptIns(netoMembers, communityNoMel.id),
      ...makeOptIns(gimenezMembers, communityGimenez.id),
      ...makeOptIns(gigiMembers, communityGigi.id),
    ],
    skipDuplicates: true,
  });

  console.log("✅ CommunityOptIns created (sidebar + ranking)");

  // =============================================================================
  // POSTS IN SPACES
  // =============================================================================
  const feedBarba = spacesBarba[0]; // Feed Geral
  const mithBarba = spacesBarba[1]; // Queimando Mitos
  const techBarba = spacesBarba[2]; // Técnicas & Processos
  const feedCorujao = spacesCorujao[0];
  const zikaCorujao = spacesCorujao[1];
  const feedNoMel = spacesNoMel[0];
  const aulasNoMel = spacesNoMel[1];

  await db.post.createMany({
    data: [
      // Barba — Feed
      { spaceId: feedBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, body: "Fala galera! Bem-vindos à comunidade. Aqui a gente não aceita enrolação — só técnica de verdade. Preparem-se para o melhor conteúdo de estética automotiva do Brasil. 🔥", isPinned: true, likeCount: 312, commentCount: 47, viewCount: 1840 },
      { spaceId: feedBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, body: "Live de amanhã confirmada! Vamos falar sobre os 5 maiores erros que você provavelmente está cometendo no polimento. Coloca no calendário — 20h no YouTube e aqui na plataforma.", likeCount: 198, commentCount: 23, viewCount: 954, createdAt: new Date(Date.now() - 86400000) },
      { spaceId: feedBarba.id, authorId: demoMembers[0].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Finalmente consegui o acabamento espelho no Honda Civic do cliente. Levei 3 aulas do Barba pra chegar nesse resultado. Valeu demais o conteúdo! Foto em anexo 🚗✨", likeCount: 87, commentCount: 14, viewCount: 432, createdAt: new Date(Date.now() - 2 * 86400000) },
      { spaceId: feedBarba.id, authorId: demoMembers[1].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Pergunta pra galera: qual politriz vocês recomendam pra quem está começando? Estou entre a Rupes e a Flex. Orçamento até R$1.200.", likeCount: 45, commentCount: 32, viewCount: 287, createdAt: new Date(Date.now() - 3 * 86400000) },
      // Barba — Queimando Mitos
      { spaceId: mithBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, body: "MITO QUEIMADO: 'Cera protege mais que vitrificação.' ERRADO. Cera tem durabilidade de 2-3 meses. Vitrificação nano cerâmica, bem aplicada, dura 2-5 anos. Contexto importa.", isPinned: true, likeCount: 456, commentCount: 78, viewCount: 3210 },
      { spaceId: mithBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, body: "MITO: 'PPF é só pra carro caro.' Pelo contrário. O carro que mais precisa de proteção é o do dia a dia, que está constantemente em garagens, estacionamentos e rodovias.", likeCount: 289, commentCount: 41, viewCount: 1870, createdAt: new Date(Date.now() - 4 * 86400000) },
      { spaceId: techBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, body: "Processo completo de detalhamento: 1) Pré-lavagem 2) Lavagem com 2 baldes 3) Descontaminação química 4) Clay bar 5) Inspeção com luz 6) Polimento 7) IPA wipe 8) Proteção. Cada etapa tem sua importância. Pular é erro.", likeCount: 334, commentCount: 56, viewCount: 2100, createdAt: new Date(Date.now() - 86400000) },
      // Corujão — Feed
      { spaceId: feedCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, body: "A rua ensinou que você não precisa de equipamento caro pra fazer trabalho bom. Precisa de TÉCNICA. E técnica se aprende. Bem-vindos à comunidade. 🦉", isPinned: true, likeCount: 245, commentCount: 38, viewCount: 1560 },
      { spaceId: feedCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Meet & Greet no Rio de Janeiro foi INSANO! Obrigado a todos que foram. A comunidade é isso — galera que se encontra, troca conhecimento e evolui junto. Próximo evento em breve.", likeCount: 312, commentCount: 67, viewCount: 2340, createdAt: new Date(Date.now() - 3 * 86400000) },
      { spaceId: zikaCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Trabalho de hoje: Mercedes GLE 450 saindo do zero pro full detailing. Cliente pediu polimento + PPF + vitrificação cerâmica. 3 dias de trabalho, resultado zika demais.", isPinned: true, likeCount: 521, commentCount: 89, viewCount: 4120, createdAt: new Date(Date.now() - 2 * 86400000) },
      // No Mel — Feed
      { spaceId: feedNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Bem-vindos à Comunidade no Mel! Aqui a educação vem primeiro. Nossa missão: fazer de você um profissional completo em estética automotiva. Aproveite cada aula. 🍯", isPinned: true, likeCount: 287, commentCount: 44, viewCount: 1780 },
      { spaceId: feedNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Módulo 3 liberado hoje! 'Especialização — Precificação e Captação de Clientes'. Esse módulo mudou a vida de muitos alunos que conseguiram triplicar o faturamento depois de aplicar as técnicas de precificação.", likeCount: 198, commentCount: 27, viewCount: 987, createdAt: new Date(Date.now() - 86400000) },
      { spaceId: aulasNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, body: "DÚVIDA FREQUENTE: Qual é a diferença entre polish e compound? Polish é abrasivo mais fino — para riscos leves e hologramas. Compound é abrasivo pesado — para riscos mais profundos. Sempre comece pelo menos abrasivo.", likeCount: 156, commentCount: 23, viewCount: 876, createdAt: new Date(Date.now() - 2 * 86400000) },
      { spaceId: aulasNoMel.id, authorId: demoMembers[149].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Terminei o módulo de fundamentos hoje. Cara, a aula de lavagem correta mudou minha perspectiva completamente. Nunca tinha entendido a importância do pré-lavagem. Obrigado Neto!", likeCount: 67, commentCount: 11, viewCount: 345, createdAt: new Date(Date.now() - 3 * 86400000) },
    ],
  });

  console.log("✅ Posts created in spaces");

  // =============================================================================
  // EVENTS
  // =============================================================================
  const eventBarba1 = await db.event.create({
    data: {
      hostId: barbaUser.id,
      communityId: communityBarba.id,
      title: "Workshop de Polimento Profissional — São Paulo",
      slug: "workshop-polimento-profissional-sp-barba",
      description: "Imersão de 8 horas com o Barba. Polimento de correção, acabamento espelho e proteção. Vagas limitadas para garantir atenção individual.",
      type: EventType.IN_PERSON,
      status: EventStatus.COMPLETED,
      startAt: new Date(Date.now() - 45 * 86400000),
      endAt: new Date(Date.now() - 45 * 86400000 + 8 * 3600000),
      location: "Centro Automotivo Zona Sul, Av. Giovanni Gronchi, 5000 — São Paulo, SP",
      capacity: 200,
      isPublic: true,
    },
  });

  const ticketBarba1 = await db.eventTicketType.create({
    data: { eventId: eventBarba1.id, name: "Ingresso Geral", price: 297, quantity: 150, sold: 148, isActive: true },
  });
  const ticketBarba1VIP = await db.eventTicketType.create({
    data: { eventId: eventBarba1.id, name: "VIP (inclui kit detailing)", price: 497, quantity: 50, sold: 47, isActive: true },
  });

  const eventBarba2 = await db.event.create({
    data: {
      hostId: barbaUser.id,
      communityId: communityBarba.id,
      title: "Imersão Detailing Avançado — São Paulo",
      slug: "imersao-detailing-avancado-sp-barba",
      description: "Dois dias intensivos: Dia 1 PPF completo, Dia 2 Cerâmica profissional. Certificado de conclusão incluso.",
      type: EventType.IN_PERSON,
      status: EventStatus.PUBLISHED,
      startAt: new Date(Date.now() + 22 * 86400000),
      endAt: new Date(Date.now() + 23 * 86400000 + 8 * 3600000),
      location: "Centro Automotivo Zona Sul, Av. Giovanni Gronchi, 5000 — São Paulo, SP",
      capacity: 120,
      isPublic: true,
    },
  });

  const ticketBarba2 = await db.eventTicketType.create({
    data: { eventId: eventBarba2.id, name: "Ingresso Padrão", price: 597, quantity: 80, sold: 63, isActive: true },
  });
  const ticketBarba2VIP = await db.eventTicketType.create({
    data: { eventId: eventBarba2.id, name: "VIP + Mentoria 1:1", price: 997, quantity: 40, sold: 28, isActive: true },
  });

  const eventBarba3 = await db.event.create({
    data: {
      hostId: barbaUser.id,
      communityId: communityBarba.id,
      title: "Live Q&A: Tire Suas Dúvidas com o Barba",
      slug: "live-qa-barba-março",
      description: "Uma hora ao vivo para responder as dúvidas mais votadas da comunidade. Interação em tempo real.",
      type: EventType.ONLINE,
      status: EventStatus.PUBLISHED,
      startAt: new Date(Date.now() + 8 * 86400000),
      endAt: new Date(Date.now() + 8 * 86400000 + 3600000),
      onlineUrl: "https://meet.google.com/barba-qa",
      isPublic: true,
    },
  });

  const ticketBarba3 = await db.eventTicketType.create({
    data: { eventId: eventBarba3.id, name: "Gratuito para membros", price: 0, sold: 143, isActive: true },
  });

  // Corujão events
  const eventCorujao1 = await db.event.create({
    data: {
      hostId: corujaoUser.id,
      communityId: communityCorujao.id,
      title: "É Zika! Meet & Greet — Rio de Janeiro",
      slug: "e-zika-meet-greet-rj-corujao",
      description: "O Corujão no Rio! Tarde de networking, detailing ao vivo e muito conteúdo da rua.",
      type: EventType.IN_PERSON,
      status: EventStatus.COMPLETED,
      startAt: new Date(Date.now() - 30 * 86400000),
      endAt: new Date(Date.now() - 30 * 86400000 + 5 * 3600000),
      location: "Espaço Cultural do Detailer, Barra da Tijuca — Rio de Janeiro, RJ",
      capacity: 150,
      isPublic: true,
    },
  });

  const ticketCorujao1 = await db.eventTicketType.create({
    data: { eventId: eventCorujao1.id, name: "Ingresso", price: 97, quantity: 150, sold: 128, isActive: true },
  });

  const eventCorujao2 = await db.event.create({
    data: {
      hostId: corujaoUser.id,
      communityId: communityCorujao.id,
      title: "Workshop Técnicas da Rua — Belo Horizonte",
      slug: "workshop-tecnicas-rua-bh-corujao",
      description: "Corujão em BH! Tarde de polimento e detailing ao estilo da rua. Sem frescura, muita técnica.",
      type: EventType.IN_PERSON,
      status: EventStatus.PUBLISHED,
      startAt: new Date(Date.now() + 35 * 86400000),
      endAt: new Date(Date.now() + 35 * 86400000 + 6 * 3600000),
      location: "Autodetailing Academy BH, Av. Raja Gabaglia, 1000 — Belo Horizonte, MG",
      capacity: 80,
      isPublic: true,
    },
  });

  const ticketCorujao2 = await db.eventTicketType.create({
    data: { eventId: eventCorujao2.id, name: "Ingresso", price: 197, quantity: 80, sold: 44, isActive: true },
  });

  // No Mel events
  const eventNeto1 = await db.event.create({
    data: {
      hostId: netoUser.id,
      communityId: communityNoMel.id,
      title: "Curso Presencial: Cerâmica e PPF — São Paulo",
      slug: "curso-ceramica-ppf-sp-neto",
      description: "Dia inteiro focado em proteção premium. Aplicação prática de cerâmica e PPF em carros reais. Certificado ao final.",
      type: EventType.IN_PERSON,
      status: EventStatus.PUBLISHED,
      startAt: new Date(Date.now() + 18 * 86400000),
      endAt: new Date(Date.now() + 18 * 86400000 + 9 * 3600000),
      location: "Auto Escola No Mel, Rua dos Detailers, 400 — Campinas, SP",
      capacity: 30,
      isPublic: true,
    },
  });

  const ticketNeto1 = await db.eventTicketType.create({
    data: { eventId: eventNeto1.id, name: "Vaga padrão", price: 897, quantity: 25, sold: 18, isActive: true },
  });
  const ticketNeto1VIP = await db.eventTicketType.create({
    data: { eventId: eventNeto1.id, name: "Vaga Premium (kit incluso)", price: 1197, quantity: 5, sold: 4, isActive: true },
  });

  const eventNeto2 = await db.event.create({
    data: {
      hostId: netoUser.id,
      communityId: communityNoMel.id,
      title: "Aula Online: Precificação para Detailers",
      slug: "aula-online-precificacao-detailers-neto",
      description: "Como cobrar o valor certo pelo seu trabalho. Planilha de precificação, tabela de serviços e estratégia de posicionamento.",
      type: EventType.ONLINE,
      status: EventStatus.PUBLISHED,
      startAt: new Date(Date.now() + 12 * 86400000),
      endAt: new Date(Date.now() + 12 * 86400000 + 2 * 3600000),
      onlineUrl: "https://zoom.us/j/nomel-precificacao",
      isPublic: true,
    },
  });

  const ticketNeto2 = await db.eventTicketType.create({
    data: { eventId: eventNeto2.id, name: "Acesso à aula", price: 0, sold: 97, isActive: true },
  });

  // Add some registrations to events
  const registrationMembers = demoMembers.slice(0, 30);
  await db.eventRegistration.createMany({
    data: [
      // Barba completed event — 30 registrations
      ...registrationMembers.slice(0, 20).map((m) => ({ eventId: eventBarba1.id, userId: m.id, ticketTypeId: ticketBarba1.id, status: "ATTENDED" as const, amount: 297 })),
      ...registrationMembers.slice(20, 25).map((m) => ({ eventId: eventBarba1.id, userId: m.id, ticketTypeId: ticketBarba1VIP.id, status: "ATTENDED" as const, amount: 497 })),
      // Barba upcoming imersão
      ...demoMembers.slice(5, 25).map((m) => ({ eventId: eventBarba2.id, userId: m.id, ticketTypeId: ticketBarba2.id, status: "CONFIRMED" as const, amount: 597 })),
      ...demoMembers.slice(25, 35).map((m) => ({ eventId: eventBarba2.id, userId: m.id, ticketTypeId: ticketBarba2VIP.id, status: "CONFIRMED" as const, amount: 997 })),
      // Barba live Q&A
      ...demoMembers.slice(0, 40).map((m) => ({ eventId: eventBarba3.id, userId: m.id, ticketTypeId: ticketBarba3.id, status: "CONFIRMED" as const, amount: 0 })),
      { eventId: eventBarba3.id, userId: member1.id, ticketTypeId: ticketBarba3.id, status: "CONFIRMED" as const, amount: 0 },
      // Corujão completed event
      ...demoMembers.slice(200, 228).map((m) => ({ eventId: eventCorujao1.id, userId: m.id, ticketTypeId: ticketCorujao1.id, status: "ATTENDED" as const, amount: 97 })),
      // Corujão upcoming BH
      ...demoMembers.slice(200, 244).map((m) => ({ eventId: eventCorujao2.id, userId: m.id, ticketTypeId: ticketCorujao2.id, status: "CONFIRMED" as const, amount: 197 })),
      // Neto São Paulo
      ...demoMembers.slice(350, 368).map((m) => ({ eventId: eventNeto1.id, userId: m.id, ticketTypeId: ticketNeto1.id, status: "CONFIRMED" as const, amount: 897 })),
      ...demoMembers.slice(368, 372).map((m) => ({ eventId: eventNeto1.id, userId: m.id, ticketTypeId: ticketNeto1VIP.id, status: "CONFIRMED" as const, amount: 1197 })),
      // Neto online precificação
      ...demoMembers.slice(350, 397).map((m) => ({ eventId: eventNeto2.id, userId: m.id, ticketTypeId: ticketNeto2.id, status: "CONFIRMED" as const, amount: 0 })),
      { eventId: eventNeto2.id, userId: member2.id, ticketTypeId: ticketNeto2.id, status: "CONFIRMED" as const, amount: 0 },
    ],
  });

  console.log("✅ Events with tickets and registrations created");

  // =============================================================================
  // PAYMENTS (historical data)
  // =============================================================================
  await db.payment.createMany({
    data: [
      { userId: member1.id, amount: 708, currency: "brl", status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: new Date(Date.now() - 30 * 86400000) },
      { userId: member2.id, amount: 708, currency: "brl", status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: new Date(Date.now() - 25 * 86400000) },
    ],
  });
  console.log("✅ Payment history created");

  // =============================================================================
  // SAAS TOOLS
  // =============================================================================
  await db.saasTool.createMany({
    data: [
      { name: "RD Station", description: "Plataforma completa de automação de marketing para empresas brasileiras. CRM, email marketing, landing pages e mais.", shortDesc: "Marketing automation made in Brazil", category: SaaSToolCategory.MARKETING, websiteUrl: "https://rdstation.com", isActive: true, isFeatured: true, tags: ["crm", "email", "automacao", "marketing"], pricing: { starter: "R$50/mês", pro: "R$200/mês" }, rating: 4.5, sortOrder: 1 },
      { name: "Hotmart", description: "Plataforma de infoprodutos e cursos online. Venda seus produtos digitais com segurança.", category: SaaSToolCategory.FINANCE, websiteUrl: "https://hotmart.com", isActive: true, isFeatured: true, tags: ["infoprodutos", "cursos", "pagamentos"], pricing: { free: "Gratuito + comissão" }, rating: 4.3, sortOrder: 2 },
      { name: "Notion", description: "Workspace all-in-one para notas, projetos, wikis e banco de dados.", category: SaaSToolCategory.PRODUCTIVITY, websiteUrl: "https://notion.so", isActive: true, tags: ["produtividade", "notas", "projetos", "wiki"], pricing: { free: "Gratuito", pro: "$8/mês" }, rating: 4.7, sortOrder: 3 },
      { name: "Canva", description: "Design gráfico simplificado para criar posts, apresentações, logos e muito mais.", category: SaaSToolCategory.DESIGN, websiteUrl: "https://canva.com", isActive: true, isFeatured: true, tags: ["design", "criativo", "posts", "apresentacoes"], pricing: { free: "Gratuito", pro: "R$54/mês" }, rating: 4.8, sortOrder: 4 },
      { name: "Google Analytics 4", description: "Análise web avançada para entender o comportamento dos seus usuários.", category: SaaSToolCategory.ANALYTICS, websiteUrl: "https://analytics.google.com", isActive: true, tags: ["analytics", "dados", "trafego"], pricing: { free: "Gratuito" }, rating: 4.4, sortOrder: 5 },
    ],
  });
  console.log("✅ SaaS tools created");

  // =============================================================================
  // MARKETPLACE LISTINGS
  // =============================================================================
  await db.marketplaceListing.createMany({
    data: [
      { sellerId: barbaUser.id, title: "Guia Definitivo de Polimento — Barba", slug: "guia-polimento-barba", description: "O guia completo do Barba para polimento profissional. Sem pink lemonade, só técnica real.", shortDesc: "Técnica de polimento sem enrolação", type: "EBOOK", status: "ACTIVE", price: 67, currency: "brl", tags: ["polimento", "estetica", "barba", "detailing"], categories: ["estetica-automotiva", "tecnica"], features: ["120 páginas", "Técnicas passo a passo", "Lista de produtos recomendados", "Acesso vitalício"], isFeatured: true, totalSales: 245, averageRating: 4.9, reviewCount: 87 },
      { sellerId: netoUser.id, title: "Pack de Aulas Bônus — Comunidade no Mel", slug: "pack-aulas-bonus-no-mel", description: "Módulo extra com 10 aulas avançadas do Neto sobre cerâmica, PPF e cuidados premium.", shortDesc: "10 aulas avançadas de estética automotiva", type: "COURSE", status: "ACTIVE", price: 197, currency: "brl", tags: ["aulas", "ceramica", "ppf", "estetica", "neto"], categories: ["estetica-automotiva", "educacao"], features: ["10 aulas em vídeo", "Material de apoio", "Certificado", "Acesso vitalício"], isFeatured: true, totalSales: 132, averageRating: 4.8, reviewCount: 54 },
      { sellerId: corujaoUser.id, title: "Checklist Zika — Processo Completo", slug: "checklist-zika-corujao", description: "O checklist do Corujão para não errar em nenhum passo do processo.", shortDesc: "Checklist completo do processo de detailing", type: "TEMPLATE", status: "ACTIVE", price: 27, currency: "brl", tags: ["checklist", "processo", "detailing", "corujao"], categories: ["estetica-automotiva", "produtividade"], features: ["Checklist imprimível", "Versão digital editável", "Suporte por 30 dias"], isFeatured: false, totalSales: 198, averageRating: 4.7, reviewCount: 63 },
    ],
  });
  console.log("✅ Marketplace listings created");

  // =============================================================================
  // FETCH REMAINING SPACES
  // =============================================================================
  const spacesGimenez = await db.space.findMany({ where: { communityId: communityGimenez.id }, orderBy: { sortOrder: "asc" } });
  const spacesGigi = await db.space.findMany({ where: { communityId: communityGigi.id }, orderBy: { sortOrder: "asc" } });

  const feedGimenez = spacesGimenez[0];
  const feedGigi = spacesGigi[0];

  // =============================================================================
  // BADGES
  // =============================================================================
  const badgeQueimaMitos = await db.badge.create({ data: { name: "Queima-Mitos", description: "Participante ativo que questiona e aprende sem aceitar enrolação", icon: "🔥", color: "#FA4616", requirement: { type: "manual" } } });
  const badgeTopDetailer  = await db.badge.create({ data: { name: "Top Detailer", description: "Ranqueado entre os 10 primeiros da comunidade", icon: "🏆", color: "#F7941D", requirement: { type: "ranking", threshold: 10 } } });
  const badgePrimeiroPost = await db.badge.create({ data: { name: "Primeiro Post", description: "Publicou sua primeira mensagem na comunidade", icon: "✍️", color: "#009CD9", requirement: { type: "post_count", threshold: 1 } } });
  const badgePremium      = await db.badge.create({ data: { name: "Assinante", description: "Assinante ativo da plataforma", icon: "💎", color: "#006079", requirement: { type: "platform_member" } } });
  const badgeDetailerPro  = await db.badge.create({ data: { name: "Detailer Pro", description: "Profissional reconhecido pela comunidade", icon: "⚡", color: "#007A99", requirement: { type: "manual" } } });
  const badgeZikaDaRua    = await db.badge.create({ data: { name: "Zika da Rua", description: "Membro veterano da comunidade do Corujão", icon: "🦉", color: "#F7941D", requirement: { type: "manual" } } });
  const badgeFormadoNoMel = await db.badge.create({ data: { name: "Formado no Mel", description: "Completou os módulos de fundamentos", icon: "🎓", color: "#FCB749", requirement: { type: "module_complete" } } });

  console.log("✅ Badges created");

  // =============================================================================
  // MORE POSTS — Barba, Corujão, NoMel, Gimenez, Gigi
  // =============================================================================
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

  await db.post.createMany({ data: [
    // ── Barba (feed + tira-duvidas)
    { spaceId: feedBarba.id, authorId: demoMembers[2].id, communityId: communityBarba.id, type: PostType.TEXT, title: "Antes x depois — Audi A4 preta após polimento nível 2", body: "Carro veio com arranhões profundos em toda a lateral. Após 8h de trabalho e seguindo o método do Barba, saiu assim. Cliente ficou sem acreditar que era o mesmo carro 🤩", likeCount: 134, commentCount: 18, viewCount: 892, createdAt: d(4) },
    { spaceId: feedBarba.id, authorId: demoMembers[3].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Alguém já usou o Gyeon Q2 em preto fosco? Como foi a durabilidade? Pensando em indicar para um cliente com Porsche Macan.", likeCount: 56, commentCount: 21, viewCount: 340, createdAt: d(5) },
    { spaceId: feedBarba.id, authorId: demoMembers[4].id, communityId: communityBarba.id, type: PostType.TEXT, title: "Meu primeiro serviço de vitrificação completa — R$1.800 cobrado!", body: "Demorei 2 meses pra ter coragem de oferecer vitrificação pro cliente. Hoje fechei o primeiro por R$1.800. Obrigado pela aula de precificação! Antes eu cobrava R$600 'pra fechar'... que vergonha.", likeCount: 203, commentCount: 31, viewCount: 1240, createdAt: d(6) },
    { spaceId: feedBarba.id, authorId: demoMembers[5].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Pergunta técnica: ao aplicar vitrificação em temperatura de 32°C, o flash time fica mais curto? Estou tendo dificuldade de remover o excesso sem marcar.", likeCount: 78, commentCount: 24, viewCount: 465, createdAt: d(7) },
    { spaceId: feedBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, title: "ATENÇÃO: cuidado com produtos sem registro no INMETRO", body: "Recebi mensagem de 3 membros sobre produtos piratas causando manchas permanentes. Antes de comprar qualquer produto, verifique o registro. Listei aqui os que eu uso e confio. ⚠️", likeCount: 445, commentCount: 62, viewCount: 3210, createdAt: d(8) },
    { spaceId: feedBarba.id, authorId: demoMembers[6].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Montei meu setup completo esse mês: politriz Rupes LK21 + Flex XFE 15 + 12 pads variados + suporte de parede. Investimento total R$4.200. Já recuperei em 3 serviços de polimento.", likeCount: 167, commentCount: 27, viewCount: 1080, createdAt: d(9) },
    { spaceId: feedBarba.id, authorId: demoMembers[7].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Clay bar ou descontaminação química primeiro? Sempre fico em dúvida na ordem do processo.", likeCount: 45, commentCount: 19, viewCount: 287, createdAt: d(10) },
    { spaceId: feedBarba.id, authorId: demoMembers[8].id, communityId: communityBarba.id, type: PostType.TEXT, title: "Resultado do workshop presencial em SP — resumo", body: "Quem foi no workshop do Barba semana passada — valeu DEMAIS. Aprendi mais em 8h do que em 1 ano vendo vídeo. Se tiver oportunidade, não perca o próximo. 🙌", likeCount: 289, commentCount: 44, viewCount: 1780, createdAt: d(11) },
    { spaceId: mithBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, title: "MITO: 'Polimento remove a pintura do carro'", body: "ERRADO. O polimento remove material da camada de clear (verniz), não da tinta base. Um clear novo tem em média 40-60 microns. Um polimento profissional consome 1-3 microns. Com medidor de espessura e técnica correta, você pode fazer dezenas de polimentos sem problema.", likeCount: 512, commentCount: 93, viewCount: 4670, createdAt: d(12) },
    { spaceId: mithBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, title: "MITO: 'Lavagem a seco não danifica a pintura'", body: "MITO PERIGOSO. Lavagem a seco arrasta partículas sólidas (areia, poeira) diretamente sobre o verniz. Mesmo com produto 'premium', você está criando microriscos. A água lubrifica e suspende o contaminante. Não existe substituto seguro para a lavagem com água.", likeCount: 387, commentCount: 68, viewCount: 3120, createdAt: d(14) },
    { spaceId: techBarba.id, authorId: barbaUser.id, communityId: communityBarba.id, type: PostType.TEXT, title: "Guia de velocidade e pressão por tipo de serviço", body: "Salvem isso:\n\n🔧 Correção pesada (compound): vel. 5-6, pressão média-alta\n🔧 Correção leve (polish): vel. 4-5, pressão média\n✨ Acabamento (finishing): vel. 3-4, pressão leve\n\nO erro mais comum é usar vel. 6 para tudo. Isso esquenta demais e pode marcar.", likeCount: 456, commentCount: 74, viewCount: 3890, createdAt: d(15) },
    { spaceId: techBarba.id, authorId: demoMembers[9].id, communityId: communityBarba.id, type: PostType.TEXT, body: "Alguém tem experiência com a LC800 da Lake Country nos pads de espuma laranja para finishing? Comparando com o pad preto da Scholl.", likeCount: 34, commentCount: 12, viewCount: 198, createdAt: d(16) },

    // ── Corujão (feed + tira-duvidas)
    { spaceId: feedCorujao.id, authorId: demoMembers[70].id, communityId: communityCorujao.id, type: PostType.TEXT, title: "Meu BMW M3 após detailing completo na garagem", body: "3 dias de trabalho, polimento nível 2, Gtechniq Crystal Serum Ultra, e o resultado foi absurdo. Quem tiver dúvida sobre investir no conteúdo do Corujão, pode vir de olhos fechados 🦉", likeCount: 245, commentCount: 37, viewCount: 1950, createdAt: d(4) },
    { spaceId: feedCorujao.id, authorId: demoMembers[71].id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Alguém sabe quando sai o próximo meet & greet? Quero muito participar mas não consigo ir a SP.", likeCount: 67, commentCount: 15, viewCount: 412, createdAt: d(5) },
    { spaceId: feedCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, title: "Minha visão sobre equipamento barato vs. caro", body: "Vi muita gente na dúvida: 'Corujão, vale a pena comprar politriz importada sendo iniciante?'\n\nMinha resposta: Não. Aprenda a técnica primeiro. Uma politriz nacional de R$400 nas mãos de quem sabe polir entrega resultado melhor que uma Rupes de R$2.000 sem técnica. Técnica primeiro, equipamento depois.", likeCount: 678, commentCount: 112, viewCount: 5230, createdAt: d(6) },
    { spaceId: feedCorujao.id, authorId: demoMembers[72].id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Primeira vez que cobrei R$2.000 num serviço. VW Tiguan, polimento completo + cerâmica 2 camadas. Cliente deu gorjeta de R$200. Isso aqui não tem preço 🙏", likeCount: 389, commentCount: 55, viewCount: 2780, createdAt: d(7) },
    { spaceId: feedCorujao.id, authorId: demoMembers[73].id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Pergunta: qual a diferença real entre cerâmica 1 camada e 2 camadas? Vale a cobrança extra?", likeCount: 89, commentCount: 28, viewCount: 567, createdAt: d(8) },
    { spaceId: feedCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, title: "📢 COMUNICADO: próxima live sexta-feira 20h", body: "Fala galera! Sexta que vem, 20h, vou fazer uma live mostrando um Porsche 911 completo sendo preparado do zero pro salão do automóvel. Prometo que vai surpreender. Não percam!", likeCount: 534, commentCount: 89, viewCount: 4120, createdAt: d(9) },
    { spaceId: feedCorujao.id, authorId: demoMembers[74].id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Acabei de terminar meu primeiro PPF em parachoque dianteiro. Levei 4h mas o resultado ficou profissional. Quem disse que não dava não estava errado — era só questão de praticar.", likeCount: 156, commentCount: 22, viewCount: 987, createdAt: d(11) },
    { spaceId: zikaCorujao.id, authorId: corujaoUser.id, communityId: communityCorujao.id, type: PostType.TEXT, title: "Ferrari 488 GTB — full detailing + proteção total", body: "Carro chegou do cliente com swirls em toda lataria. Após 3 dias: polimento nível 2, Ceramic Pro Platinum (5 anos), PPF nas zonas críticas. Ticket: R$8.500. Às vezes a galera não acredita que tem esse mercado no Brasil — tem sim. 🏎️", likeCount: 892, commentCount: 156, viewCount: 8970, createdAt: d(3) },
    { spaceId: zikaCorujao.id, authorId: demoMembers[75].id, communityId: communityCorujao.id, type: PostType.TEXT, body: "Inspirado pelo Corujão, fiz hoje meu primeiro trabalho em carro de alto padrão. Range Rover Vogue. Vitrificação 9H. Tirei fotos antes e depois com iluminação correta como ensinado. Cliente amou. Que sensação!", likeCount: 234, commentCount: 33, viewCount: 1560, createdAt: d(5) },

    // ── No Mel (feed + aulas)
    { spaceId: feedNoMel.id, authorId: demoMembers[140].id, communityId: communityNoMel.id, type: PostType.TEXT, title: "Apliquei a planilha do módulo 5 e triplicou meu faturamento", body: "Sério. Antes eu cobrava R$80 por lavagem + cera. Depois de fazer o módulo de precificação, calculei meu custo real e montei minha tabela. Hoje cobro R$350 pelo mesmo serviço com uma apresentação diferente. Em 45 dias, triplicou o faturamento.", likeCount: 312, commentCount: 47, viewCount: 2130, createdAt: d(4) },
    { spaceId: feedNoMel.id, authorId: demoMembers[141].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Qual produto de limpeza de couro vocês recomendam? Tenho visto o Sonax e o Meguiar's. Preço muito diferente, mas não sei se entrega diferença proporcional.", likeCount: 67, commentCount: 19, viewCount: 412, createdAt: d(5) },
    { spaceId: feedNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, title: "Dica de ouro: como fotografar antes e depois corretamente", body: "Vejo muita foto de before/after mal feita. Dicas:\n\n1. Sempre na mesma posição (mesma distância, ângulo, altura)\n2. Luz artificial consistente — não dependa do sol\n3. Fundo limpo ou neutro\n4. Resolução máxima do celular\n5. Não edite as fotos — cliente percebe\n\nFoto honesta vende mais que foto editada.", likeCount: 423, commentCount: 67, viewCount: 3340, createdAt: d(6) },
    { spaceId: feedNoMel.id, authorId: demoMembers[142].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Fechei hoje um contrato de manutenção mensal com garagem! R$800/mês, 4 carros, visita quinzenal. Esse modelo de recorrência que o Neto ensinou no módulo 7 é gold.", likeCount: 278, commentCount: 38, viewCount: 1780, createdAt: d(7) },
    { spaceId: feedNoMel.id, authorId: demoMembers[143].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Dúvida: como explico para o cliente a diferença entre polish e vitrificação sem parecer que estou empurrando serviço mais caro?", likeCount: 89, commentCount: 24, viewCount: 567, createdAt: d(8) },
    { spaceId: feedNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, title: "Módulo 4 atualizado com aula bônus de higienização de motor", body: "Pessoal, atualizei o Módulo 4 com uma aula bônus de 20 minutos sobre higienização de motor de alta performance (turbos, V8, etc). Acessa na aba de trilhas. Bom aprendizado! 🍯", likeCount: 189, commentCount: 28, viewCount: 1230, createdAt: d(9) },
    { spaceId: aulasNoMel.id, authorId: demoMembers[144].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Terminei o módulo de polimento hoje. A aula 2.3 sobre rotativa me abriu a cabeça. Estava com medo de usar rotativa há 2 anos. Agora me sinto preparado para testar com supervisão.", likeCount: 145, commentCount: 18, viewCount: 876, createdAt: d(10) },
    { spaceId: aulasNoMel.id, authorId: demoMembers[145].id, communityId: communityNoMel.id, type: PostType.TEXT, body: "Dúvida técnica aula 1.2: o Neto menciona flash time 'visual' no ceramic. Como identificar esse momento exatamente? Às vezes fico confuso se é um reflexo ou se realmente flashou.", likeCount: 56, commentCount: 15, viewCount: 345, createdAt: d(12) },
    { spaceId: aulasNoMel.id, authorId: netoUser.id, communityId: communityNoMel.id, type: PostType.TEXT, title: "Resposta: como identificar o flash time visualmente", body: "Boa pergunta! O flash time visual tem 3 indicadores:\n\n1. A superfície perde o brilho 'molhado' e fica levemente fosca\n2. Ao passar o dedo (com luva), não estica mais — resiste\n3. Em luz lateral, aparecem microestrias de aplicação\n\nEm dias quentes (>28°C), acontece em 30-60 segundos. Em dias frios, pode levar 3-5 minutos.", likeCount: 234, commentCount: 29, viewCount: 1560, createdAt: d(13) },

    // ── Gimenez (feed)
    { spaceId: feedGimenez.id, authorId: gimenezUser.id, communityId: communityGimenez.id, type: PostType.TEXT, body: "Bem-vindos à Garagem do Gimenez! Aqui é o lugar onde a paixão por carros encontra a técnica. Vamos juntos nessa! 🚗", isPinned: true, likeCount: 198, commentCount: 32, viewCount: 1340, createdAt: d(30) },
    { spaceId: feedGimenez.id, authorId: demoMembers[210].id, communityId: communityGimenez.id, type: PostType.TEXT, body: "Galera, alguém já vitrificou um carro laranja pérola? Tenho dúvida se a cerâmica altera o brilho da cor.", likeCount: 45, commentCount: 17, viewCount: 289, createdAt: d(5) },
    { spaceId: feedGimenez.id, authorId: gimenezUser.id, communityId: communityGimenez.id, type: PostType.TEXT, title: "Live desta semana — preparação de Ferrari antes de salão", body: "Quinta-feira, 19h! Vou mostrar ao vivo a preparação completa de uma Ferrari 296 GTB para exposição em salão. Desde a descontaminação até o acabamento final. Não percam 🔴", likeCount: 312, commentCount: 45, viewCount: 2230, createdAt: d(4) },
    { spaceId: feedGimenez.id, authorId: demoMembers[211].id, communityId: communityGimenez.id, type: PostType.TEXT, body: "Hoje finalizei meu primeiro trabalho em carro de luxo: Jaguar F-PACE. Cliente muito exigente, muito nervoso antes. Depois... foto com o carro e indicou 2 amigos. A técnica entregou o resultado 🙌", likeCount: 178, commentCount: 23, viewCount: 1120, createdAt: d(6) },
    { spaceId: feedGimenez.id, authorId: demoMembers[212].id, communityId: communityGimenez.id, type: PostType.TEXT, body: "Vocês fazem orçamento por WhatsApp ou só presencial? Estou tendo muita dificuldade de converter orçamento remoto.", likeCount: 67, commentCount: 28, viewCount: 434, createdAt: d(7) },
    { spaceId: feedGimenez.id, authorId: gimenezUser.id, communityId: communityGimenez.id, type: PostType.TEXT, title: "Minha resposta ao 'está muito caro'", body: "Quando o cliente diz que está caro, ele não está dizendo que não tem dinheiro. Está dizendo que não entendeu o valor. Sua resposta não deve ser baixar o preço — deve ser apresentar melhor o resultado e a transformação que ele vai ter. Aprendi isso depois de dar muitos descontos que não converteram. 💡", likeCount: 445, commentCount: 78, viewCount: 3560, createdAt: d(9) },
    { spaceId: feedGimenez.id, authorId: demoMembers[213].id, communityId: communityGimenez.id, type: PostType.TEXT, body: "Acabei de comprar minha primeira politriz profissional: Rupes LHR21. Alguém tem dica de qual pad usar para iniciante em pintura branca?", likeCount: 89, commentCount: 31, viewCount: 567, createdAt: d(11) },
    { spaceId: feedGimenez.id, authorId: demoMembers[214].id, communityId: communityGimenez.id, type: PostType.TEXT, title: "Resultado do mês: R$9.400 em detailing", body: "Nunca imaginei ganhar isso em um mês fazendo algo que amo. 11 carros, mix entre higienização, polimento e vitrificação. Meta do próximo mês: R$12.000. Obrigado pela comunidade! 🙏", likeCount: 334, commentCount: 52, viewCount: 2450, createdAt: d(13) },

    // ── Gigi (feed)
    { spaceId: feedGigi.id, authorId: gigiUser.id, communityId: communityGigi.id, type: PostType.TEXT, body: "Seja bem-vindo à Sala do Gigi! Aqui cada detalhe importa. Vamos elevar o nível juntos. ✨", isPinned: true, likeCount: 156, commentCount: 24, viewCount: 1120, createdAt: d(30) },
    { spaceId: feedGigi.id, authorId: demoMembers[280].id, communityId: communityGigi.id, type: PostType.TEXT, body: "Dúvida: alguém usa aspirador extrator para higienização? Qual marca/modelo recomendam para iniciante?", likeCount: 45, commentCount: 19, viewCount: 287, createdAt: d(5) },
    { spaceId: feedGigi.id, authorId: gigiUser.id, communityId: communityGigi.id, type: PostType.TEXT, title: "A importância da luz de inspeção no trabalho profissional", body: "Sem luz de inspeção adequada, você não vê o que está fazendo. Já perdi clientes por entregar trabalho com marca de hologramas que eu não enxerguei com a luz do teto da garagem. Hoje trabalho sempre com painel LED de inspeção. Mudou tudo. ✨", likeCount: 289, commentCount: 41, viewCount: 2340, createdAt: d(4) },
    { spaceId: feedGigi.id, authorId: demoMembers[281].id, communityId: communityGigi.id, type: PostType.TEXT, body: "Primeiro trabalho completo da semana: Maserati Levante branco. Polimento de refino + Gtechniq Crystal Serum Light. Cliente pediu NF e tudo — hora de regularizar o negócio!", likeCount: 198, commentCount: 28, viewCount: 1340, createdAt: d(6) },
    { spaceId: feedGigi.id, authorId: demoMembers[282].id, communityId: communityGigi.id, type: PostType.TEXT, body: "Qual vocês preferem: Sonax Profiline ou Menzerna para correção de nível 1? Preço similar no mercado aqui de SP.", likeCount: 78, commentCount: 22, viewCount: 489, createdAt: d(7) },
    { spaceId: feedGigi.id, authorId: gigiUser.id, communityId: communityGigi.id, type: PostType.TEXT, title: "Como documentar cada serviço e construir portfólio de autoridade", body: "Cada carro que você faz é uma oportunidade de marketing. Minha rotina: 1) Foto do estado original (sempre) 2) Foto processual (durante) 3) Foto final (depois de 24h de cura) 4) Print do elogio do cliente\n\nEsse material no Instagram/Reels trouxe 40% dos meus clientes em 2024.", likeCount: 378, commentCount: 56, viewCount: 2890, createdAt: d(9) },
    { spaceId: feedGigi.id, authorId: demoMembers[283].id, communityId: communityGigi.id, type: PostType.TEXT, body: "Seguindo o método de documentação da Gigi, comecei a postar meus resultados com mais qualidade. Em 3 semanas, 4 novos clientes pelo Instagram. Vale muito a pena!", likeCount: 189, commentCount: 24, viewCount: 1230, createdAt: d(11) },
    { spaceId: feedGigi.id, authorId: demoMembers[284].id, communityId: communityGigi.id, type: PostType.TEXT, title: "Encerrei o mês com R$7.200 líquidos", body: "Maio foi o melhor mês da minha vida. 8 clientes, ticket médio R$900. Tem 6 meses eu ganhava R$1.500 fazendo coisas que não gostava. Agora faço o que amo e ganho muito mais. A plataforma mudou minha trajetória.", likeCount: 267, commentCount: 39, viewCount: 1870, createdAt: d(14) },
  ]});

  console.log("✅ Additional posts created");

  // =============================================================================
  // COMMENTS on top posts
  // =============================================================================
  const topPosts = await db.post.findMany({
    where: { communityId: { in: [communityBarba.id, communityCorujao.id, communityNoMel.id, communityGimenez.id, communityGigi.id] } },
    orderBy: { likeCount: "desc" },
    take: 15,
    select: { id: true, communityId: true },
  });

  const commentBodies = [
    "Cara, muito obrigado por compartilhar isso! Me ajudou demais 🙏",
    "Exatamente o que eu precisava saber. Salvei essa aqui.",
    "Perfeito! Já apliquei essa técnica e confirmei o resultado.",
    "Alguém tem esse mesmo problema? Aqui em Curitiba acontece bastante.",
    "Gold! Esse conteúdo vale mais que curso de R$2.000.",
    "Sempre aprendo algo novo aqui. Comunidade top! 🔥",
    "Fiz isso exatamente assim no fim de semana, cliente ficou vidrado.",
    "Confirmado! Fiz o teste e o resultado foi impressionante.",
    "Muito bom! Já estava com essa dúvida faz tempo.",
    "Compartilhei com meu grupo de detailers, todo mundo amou.",
    "Esse post deveria ser fixado. Informação demais aqui.",
    "Podia ter um vídeo sobre isso? Fica mais fácil de visualizar.",
    "Barba, você poderia fazer uma live só sobre isso? 🙏",
    "Experiência minha: funcionou perfeitamente em carro preto.",
    "Aqui em SP o mercado ainda não valoriza muito isso. Como vocês convencem o cliente?",
    "Aplicando isso amanhã no Honda Civic do meu cliente. Volto com o resultado!",
    "Isso muda tudo. Obrigado pela transparência 💪",
    "Esse método funciona em carros de película também?",
    "3 anos de trabalho e nunca tinha visto isso explicado tão claramente.",
    "Excelente conteúdo! Plataforma tá pagando demais 🙌",
  ];

  const allCommentAuthors = [...demoMembers.slice(0, 50), member1, member2];

  for (const post of topPosts) {
    const numComments = 3 + Math.floor(Math.random() * 4); // 3-6 comments per post
    await db.comment.createMany({
      data: Array.from({ length: numComments }, (_, i) => ({
        postId: post.id,
        authorId: allCommentAuthors[(i * 7 + topPosts.indexOf(post) * 3) % allCommentAuthors.length].id,
        body: commentBodies[(i * 3 + topPosts.indexOf(post)) % commentBodies.length],
        likeCount: Math.floor(Math.random() * 25),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000),
      })),
    });
  }

  console.log(`✅ Comments created on top ${topPosts.length} posts`);

  // =============================================================================
  // USER POINTS — leaderboard data per community
  // =============================================================================
  const pointsData: { userId: string; communityId: string; points: number; totalEarned: number; level: number }[] = [];

  const pointsConfig = [
    { members: barbaMembers.slice(0, 20), communityId: communityBarba.id },
    { members: corujaoMembers.slice(0, 20), communityId: communityCorujao.id },
    { members: netoMembers.slice(0, 20), communityId: communityNoMel.id },
    { members: gimenezMembers.slice(0, 20), communityId: communityGimenez.id },
    { members: gigiMembers.slice(0, 20), communityId: communityGigi.id },
  ];

  // Realistic point distribution: top member has ~3200 pts, drops off progressively
  const pointDistribution = [3240, 2890, 2650, 2410, 2180, 1950, 1720, 1540, 1380, 1210, 1080, 940, 820, 710, 620, 530, 450, 380, 290, 210];

  for (const { members, communityId } of pointsConfig) {
    for (let i = 0; i < members.length; i++) {
      const pts = pointDistribution[i];
      const level = pts >= 2000 ? 5 : pts >= 1500 ? 4 : pts >= 1000 ? 3 : pts >= 500 ? 2 : 1;
      pointsData.push({ userId: members[i].id, communityId, points: pts, totalEarned: pts, level });
    }
  }

  // Also add member1 to Barba leaderboard with good points
  pointsData.push({ userId: member1.id, communityId: communityBarba.id, points: 1650, totalEarned: 1650, level: 4 });
  pointsData.push({ userId: member2.id, communityId: communityCorujao.id, points: 980, totalEarned: 980, level: 3 });

  await db.userPoints.createMany({ data: pointsData });

  console.log(`✅ UserPoints created for leaderboard (${pointsData.length} entries)`);

  // =============================================================================
  // USER BADGES — assign to top members
  // =============================================================================
  const userBadgesData: { userId: string; badgeId: string; communityId: string | null }[] = [];

  // Premium badge for first 30 demo members
  for (const m of demoMembers.slice(0, 30)) {
    userBadgesData.push({ userId: m.id, badgeId: badgePremium.id, communityId: null });
  }
  // Premium for named members
  userBadgesData.push({ userId: member1.id, badgeId: badgePremium.id, communityId: null });
  userBadgesData.push({ userId: member2.id, badgeId: badgePremium.id, communityId: null });

  // Top Detailer for top 5 of each community
  for (const m of barbaMembers.slice(0, 5))   userBadgesData.push({ userId: m.id, badgeId: badgeTopDetailer.id, communityId: communityBarba.id });
  for (const m of corujaoMembers.slice(0, 5)) userBadgesData.push({ userId: m.id, badgeId: badgeTopDetailer.id, communityId: communityCorujao.id });
  for (const m of netoMembers.slice(0, 5))    userBadgesData.push({ userId: m.id, badgeId: badgeTopDetailer.id, communityId: communityNoMel.id });

  // Community-specific badges
  for (const m of barbaMembers.slice(0, 15))   userBadgesData.push({ userId: m.id, badgeId: badgeQueimaMitos.id, communityId: communityBarba.id });
  for (const m of corujaoMembers.slice(0, 15)) userBadgesData.push({ userId: m.id, badgeId: badgeZikaDaRua.id, communityId: communityCorujao.id });
  for (const m of netoMembers.slice(0, 15))    userBadgesData.push({ userId: m.id, badgeId: badgeFormadoNoMel.id, communityId: communityNoMel.id });

  // Detailer Pro for top 3 across all
  for (const m of demoMembers.slice(0, 3)) userBadgesData.push({ userId: m.id, badgeId: badgeDetailerPro.id, communityId: null });
  for (const m of demoMembers.slice(0, 8)) userBadgesData.push({ userId: m.id, badgeId: badgePrimeiroPost.id, communityId: communityBarba.id });

  // member1 special badges
  userBadgesData.push({ userId: member1.id, badgeId: badgeQueimaMitos.id, communityId: communityBarba.id });
  userBadgesData.push({ userId: member1.id, badgeId: badgePrimeiroPost.id, communityId: communityBarba.id });
  userBadgesData.push({ userId: member1.id, badgeId: badgeDetailerPro.id, communityId: null });

  await db.userBadge.createMany({ data: userBadgesData });
  console.log(`✅ UserBadges created (${userBadgesData.length} entries)`);

  // =============================================================================
  // USER PROFILES — bio, location, car info for named + top members
  // =============================================================================
  const profilesData = [
    { userId: member1.id, headline: "Detailer profissional — especialista em polimento e cerâmica", bio: "Trabalho com estética automotiva há 4 anos em BH. Especializado em correção de pintura e proteção cerâmica. Atendo carros nacionais e importados.", location: "Belo Horizonte, MG", socialLinks: { instagram: "instagram.com/carlosoliveira_detail" } },
    { userId: member2.id, headline: "Detailer e apaixonada por carros clássicos", bio: "Comecei na estética automotiva por paixão e hoje é meu negócio principal. Especialidade em higienização premium e cuidado com carros clássicos.", location: "São Paulo, SP", socialLinks: { instagram: "instagram.com/maria.detailing" } },
    { userId: barbaMembers[0].id, headline: "Detailer profissional — 6 anos de experiência", bio: "Aprendiz do método Barba. Especializado em polimento de correção nível 2 e 3. Atendo na Grande SP.", location: "São Paulo, SP", socialLinks: {} },
    { userId: barbaMembers[1].id, headline: "Especialista em PPF e proteção premium", bio: "Foco em carros de alto padrão: PPF, cerâmica e detailing completo. Certificado pelos principais cursos do setor.", location: "Campinas, SP", socialLinks: {} },
    { userId: corujaoMembers[0].id, headline: "Detailer da rua — técnica e autenticidade", bio: "Cresci no mercado de estética automotiva pela escola da rua. Hoje atendo clientes premium sem perder a essência.", location: "Rio de Janeiro, RJ", socialLinks: {} },
    { userId: netoMembers[0].id, headline: "Aluno do Mel — formado em 3 módulos", bio: "Terminei os módulos de fundamentos, polimento e precificação. Resultado: faturamento dobrou em 2 meses.", location: "Curitiba, PR", socialLinks: {} },
    { userId: gimenezMembers[0].id, headline: "Entusiasta e profissional de detailing", bio: "Pai de família que transformou hobby em negócio. Atendo finais de semana com qualidade de semana toda.", location: "Porto Alegre, RS", socialLinks: {} },
    { userId: gigiMembers[0].id, headline: "Detailer com foco em documentação e resultados", bio: "Aprendi na comunidade do Gigi a importância de documentar cada trabalho. Portfólio cresceu 300% em 6 meses.", location: "Florianópolis, SC", socialLinks: {} },
  ];

  await db.userProfile.createMany({ data: profilesData });
  console.log(`✅ UserProfiles created (${profilesData.length} entries)`);

  // =============================================================================
  // SUMMARY
  // =============================================================================
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              SEED COMPLETED SUCCESSFULLY                   ║
╠═══════════════════════════════════════════════════════════╣
║ SuperAdmin    admin@comunidadehub.com / Admin@123456!      ║
╠═══════════════════════════════════════════════════════════╣
║ Barba         barba@comunidade.com / Influencer@123!       ║
║               70 membros referidos · R$708 anual / R$59mês ║
║ Corujão       corujao@comunidade.com / Influencer@123!     ║
║               70 membros referidos · R$708 anual / R$59mês ║
║ Neto          neto@comunidade.com / Influencer@123!        ║
║               70 membros referidos · R$708 anual / R$59mês ║
║ Gimenez       gimenez@comunidade.com / Influencer@123!     ║
║               70 membros referidos · R$708 anual / R$59mês ║
║ Gigi          gigi@comunidade.com / Influencer@123!        ║
║               70 membros referidos · R$708 anual / R$59mês ║
╠═══════════════════════════════════════════════════════════╣
║ Member 1      membro1@email.com / Membro@123!              ║
║ Member 2      membro2@email.com / Membro@123!              ║
║ Demo members  demo1..350@detailhub.com / Membro@123!       ║
╠═══════════════════════════════════════════════════════════╣
║ Total: 352 plataforma memberships + 5 comunidades (350/ea) ║
║        7 events + posts + lives + content                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
