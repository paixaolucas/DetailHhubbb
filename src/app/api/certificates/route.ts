// =============================================================================
// POST /api/certificates — issue a certificate for completing all modules in a community
// GET  /api/certificates — list caller's certificates
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";
import { createNotification } from "@/services/notification/notification.service";

const issueSchema = z.object({
  communityId: z.string().cuid(),
});

export const GET = withAuth(async (_req, { session }) => {
  const certs = await db.certificate.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      community: { select: { name: true, slug: true, logoUrl: true } },
    },
  });
  return NextResponse.json({ success: true, data: certs });
});

export const POST = withAuth(async (req, { session }) => {
  try {
    const body = await req.json();
    const parsed = issueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }
    const { communityId } = parsed.data;

    const isMember = await verifyMembership(session.userId, communityId, session.hasPlatform);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Membership required" }, { status: 403 });
    }

    // Check if all published modules in the community are complete
    const modules = await db.contentModule.findMany({
      where: { communityId, isPublished: true },
      select: {
        id: true,
        lessons: { where: { isPublished: true }, select: { id: true } },
      },
    });

    if (modules.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum módulo disponível nesta comunidade." }, { status: 400 });
    }

    const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const completedCount = await db.contentProgress.count({
      where: { userId: session.userId, lessonId: { in: allLessonIds }, isCompleted: true },
    });

    if (completedCount < allLessonIds.length) {
      const remaining = allLessonIds.length - completedCount;
      return NextResponse.json(
        { success: false, error: `Complete todas as aulas para receber o certificado. Faltam ${remaining} aula(s).` },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.certificate.findFirst({
      where: { userId: session.userId, communityId },
      select: { id: true, code: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: "Certificado já emitido." });
    }

    const community = await db.community.findUnique({
      where: { id: communityId },
      select: { name: true, influencer: { select: { displayName: true } } },
    });

    const cert = await db.certificate.create({
      data: {
        userId: session.userId,
        communityId,
        title: `Certificado de Conclusão — ${community?.name ?? "Trilha"}`,
        issuerName: community?.influencer?.displayName ?? "Detailer'HUB",
        completedAt: new Date(),
      },
    });

    // Notify user
    createNotification({
      recipientId: session.userId,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "🎓 Certificado emitido!",
      body: `Parabéns! Você concluiu a trilha de ${community?.name} e recebeu seu certificado.`,
      link: `/certificates/${cert.code}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data: cert }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
