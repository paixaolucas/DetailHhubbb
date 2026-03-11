// =============================================================================
// GET  /api/events/[id]/ticket-types  — list ticket types (public)
// POST /api/events/[id]/ticket-types  — create ticket type (event owner)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const ticketSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  price: z.number().min(0).max(99999),
  quantity: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const GET = withAuth(async (_req, { params }) => {
  const eventId = params!.id as string;
  const types = await db.eventTicketType.findMany({
    where: { eventId, isActive: true },
    orderBy: { price: "asc" },
  });
  return NextResponse.json({ success: true, data: types });
});

export const POST = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session, params }) => {
  const eventId = params!.id as string;

  const event = await db.event.findUnique({ where: { id: eventId }, select: { hostId: true } });
  if (!event || event.hostId !== session.userId) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos", details: parsed.error.errors }, { status: 422 });
  }

  const { name, description, price, quantity, isActive } = parsed.data;

  const ticketType = await db.eventTicketType.create({
    data: {
      eventId,
      name,
      description: description || null,
      price,
      quantity: quantity ?? null,
      isActive,
    },
  });

  return NextResponse.json({ success: true, data: ticketType }, { status: 201 });
});
