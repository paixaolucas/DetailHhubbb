// =============================================================================
// POST /api/events/[id]/register  — register for an event (COMMUNITY_MEMBER)
// DELETE /api/events/[id]/register — cancel registration
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { EventStatus, EventRegistrationStatus } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  ticketTypeId: z.string(),
});

export const POST = withAuth(async (req, { session, params }) => {
  const eventId = params!.id as string;

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true },
  });

  if (!event || event.status !== EventStatus.PUBLISHED) {
    return NextResponse.json({ success: false, error: "Evento não disponível" }, { status: 404 });
  }

  // Check if already registered
  const existing = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: session.userId } },
  });
  if (existing && existing.status !== EventRegistrationStatus.CANCELED) {
    return NextResponse.json({ success: false, error: "Você já está inscrito neste evento" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 422 });
  }

  const ticketType = event.ticketTypes.find((t) => t.id === parsed.data.ticketTypeId && t.isActive);
  if (!ticketType) {
    return NextResponse.json({ success: false, error: "Tipo de ingresso inválido" }, { status: 400 });
  }

  // Check capacity
  if (event.capacity !== null) {
    const confirmed = await db.eventRegistration.count({
      where: { eventId, status: EventRegistrationStatus.CONFIRMED },
    });
    if (confirmed >= event.capacity) {
      return NextResponse.json({ success: false, error: "Evento lotado" }, { status: 400 });
    }
  }

  // Check ticket quantity
  if (ticketType.quantity !== null && ticketType.sold >= ticketType.quantity) {
    return NextResponse.json({ success: false, error: "Ingressos esgotados para este tipo" }, { status: 400 });
  }

  const price = Number(ticketType.price);

  // Free events: confirm immediately. Paid: would need Stripe (out of scope for now).
  if (price > 0) {
    return NextResponse.json(
      { success: false, error: "Pagamento para ingressos pagos ainda não implementado neste fluxo" },
      { status: 400 }
    );
  }

  const [registration] = await db.$transaction([
    existing
      ? db.eventRegistration.update({
          where: { id: existing.id },
          data: { status: EventRegistrationStatus.CONFIRMED, ticketTypeId: ticketType.id, amount: price },
        })
      : db.eventRegistration.create({
          data: {
            eventId,
            userId: session.userId,
            ticketTypeId: ticketType.id,
            status: EventRegistrationStatus.CONFIRMED,
            amount: price,
          },
        }),
    db.eventTicketType.update({
      where: { id: ticketType.id },
      data: { sold: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true, data: registration }, { status: 201 });
});

export const DELETE = withAuth(async (_req, { session, params }) => {
  const eventId = params!.id as string;

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: session.userId } },
    include: { event: { select: { startAt: true } } },
  });

  if (!registration || registration.status === EventRegistrationStatus.CANCELED) {
    return NextResponse.json({ success: false, error: "Inscrição não encontrada" }, { status: 404 });
  }

  // Can't cancel after event started
  if (registration.event.startAt <= new Date()) {
    return NextResponse.json({ success: false, error: "Não é possível cancelar após o início do evento" }, { status: 400 });
  }

  await db.$transaction([
    db.eventRegistration.update({
      where: { id: registration.id },
      data: { status: EventRegistrationStatus.CANCELED },
    }),
    db.eventTicketType.update({
      where: { id: registration.ticketTypeId },
      data: { sold: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true });
});
