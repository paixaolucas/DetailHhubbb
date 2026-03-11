// =============================================================================
// GET    /api/events/[id]   — fetch event detail
// PATCH  /api/events/[id]   — update event (owner)
// DELETE /api/events/[id]   — cancel/delete event (owner)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, EventStatus, EventType } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(5000).optional().or(z.literal("")),
  type: z.nativeEnum(EventType).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional().nullable(),
  location: z.string().max(300).optional().or(z.literal("")),
  onlineUrl: z.string().url().optional().or(z.literal("")),
  capacity: z.number().int().positive().optional().nullable(),
  isPublic: z.boolean().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

async function getEvent(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      community: { select: { id: true, name: true, logoUrl: true } },
      ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
  });
}

export const GET = withAuth(async (_req, { params }) => {
  const event = await getEvent(params!.id as string);
  if (!event) return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  return NextResponse.json({ success: true, data: event });
});

export const PATCH = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session, params }) => {
  const event = await db.event.findUnique({ where: { id: params!.id as string }, select: { id: true, hostId: true } });
  if (!event || event.hostId !== session.userId) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Dados inválidos", details: parsed.error.errors }, { status: 422 });
  }

  const { startAt, endAt, location, onlineUrl, coverImageUrl, description, capacity, ...rest } = parsed.data;

  const updated = await db.event.update({
    where: { id: event.id },
    data: {
      ...rest,
      ...(description !== undefined ? { description: description || null } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
      ...(onlineUrl !== undefined ? { onlineUrl: onlineUrl || null } : {}),
      ...(coverImageUrl !== undefined ? { coverImageUrl: coverImageUrl || null } : {}),
      ...(startAt !== undefined ? { startAt: new Date(startAt) } : {}),
      ...(endAt !== undefined ? { endAt: endAt ? new Date(endAt) : null } : {}),
      ...(capacity !== undefined ? { capacity } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = withRole(UserRole.INFLUENCER_ADMIN)(async (_req, { session, params }) => {
  const event = await db.event.findUnique({
    where: { id: params!.id as string },
    select: { id: true, hostId: true, status: true },
  });
  if (!event || event.hostId !== session.userId) {
    return NextResponse.json({ success: false, error: "Evento não encontrado" }, { status: 404 });
  }

  if (event.status === EventStatus.PUBLISHED) {
    // Soft-cancel instead of hard delete if already published
    await db.event.update({ where: { id: event.id }, data: { status: EventStatus.CANCELED } });
    return NextResponse.json({ success: true, data: { canceled: true } });
  }

  await db.event.delete({ where: { id: event.id } });
  return NextResponse.json({ success: true });
});
