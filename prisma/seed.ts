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
      price: 948,
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
  // Mix: every 5th member is monthly PIX (R$79), rest annual (R$948)
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
      { userId: member1.id, amount: 948, currency: "brl", status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: new Date(Date.now() - 30 * 86400000) },
      { userId: member2.id, amount: 948, currency: "brl", status: "SUCCEEDED", type: "SUBSCRIPTION", createdAt: new Date(Date.now() - 25 * 86400000) },
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
  // SUMMARY
  // =============================================================================
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              SEED COMPLETED SUCCESSFULLY                   ║
╠═══════════════════════════════════════════════════════════╣
║ SuperAdmin    admin@comunidadehub.com / Admin@123456!      ║
╠═══════════════════════════════════════════════════════════╣
║ Barba         barba@comunidade.com / Influencer@123!       ║
║               70 membros referidos · R$948 anual / R$79mês ║
║ Corujão       corujao@comunidade.com / Influencer@123!     ║
║               70 membros referidos · R$948 anual / R$79mês ║
║ Neto          neto@comunidade.com / Influencer@123!        ║
║               70 membros referidos · R$948 anual / R$79mês ║
║ Gimenez       gimenez@comunidade.com / Influencer@123!     ║
║               70 membros referidos · R$948 anual / R$79mês ║
║ Gigi          gigi@comunidade.com / Influencer@123!        ║
║               70 membros referidos · R$948 anual / R$79mês ║
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
