// =============================================================================
// GET /api/events/[id]/attendees  — list attendees (event owner only)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session, params }) => {
  const eventId = params!.id as string;

  const event = await db.event.findUnique({ where: { id: eventId }, select: { hostId: true } });
  if (!event || event.hostId !== session.userId) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 50;

  const [attendees, total] = await Promise.all([
    db.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        amount: true,
        checkedInAt: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        ticketType: { select: { id: true, name: true, price: true } },
      },
    }),
    db.eventRegistration.count({ where: { eventId } }),
  ]);

  return NextResponse.json({
    success: true,
    data: attendees,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});
