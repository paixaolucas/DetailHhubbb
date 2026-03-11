// =============================================================================
// GET  /api/events?communityId=&status=&upcoming=1  — list events (public)
// POST /api/events  — create event (INFLUENCER_ADMIN)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole, withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, EventType, EventStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(5000).optional().or(z.literal("")),
  communityId: z.string().optional(),
  type: z.nativeEnum(EventType).default("ONLINE"),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().default("America/Sao_Paulo"),
  location: z.string().max(300).optional().or(z.literal("")),
  onlineUrl: z.string().url().optional().or(z.literal("")),
  capacity: z.number().int().positive().optional(),
  isPublic: z.boolean().default(true),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

function slugify(title: string, id: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 60) +
    "-" +
    id.substring(0, 8)
  );
}

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const communityId = searchParams.get("communityId") ?? undefined;
  const status = searchParams.get("status") as EventStatus | null;
  const upcoming = searchParams.get("upcoming") === "1";
  const hostId = searchParams.get("hostId") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = {
    ...(communityId ? { communityId } : {}),
    ...(status ? { status } : {}),
    ...(hostId ? { hostId } : {}),
    ...(upcoming ? { startAt: { gte: new Date() } } : {}),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        startAt: true,
        endAt: true,
        location: true,
        capacity: true,
        isPublic: true,
        coverImageUrl: true,
        community: { select: { id: true, name: true, logoUrl: true } },
        host: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { registrations: true } },
        ticketTypes: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, quantity: true, sold: true },
          orderBy: { price: "asc" },
        },
      },
    }),
    db.event.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: events,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});

export const POST = withRole(UserRole.INFLUENCER_ADMIN)(async (req, { session }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.errors },
      { status: 422 }
    );
  }

  const { title, description, communityId, type, startAt, endAt, timezone, location, onlineUrl, capacity, isPublic, coverImageUrl } = parsed.data;

  // Verify community ownership if provided
  if (communityId) {
    const influencer = await db.influencer.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!influencer) return NextResponse.json({ success: false, error: "Influenciador não encontrado" }, { status: 404 });
    const community = await db.community.findFirst({ where: { id: communityId, influencerId: influencer.id } });
    if (!community) return NextResponse.json({ success: false, error: "Comunidade não encontrada" }, { status: 404 });
  }

  const id = crypto.randomUUID().substring(0, 12);
  const slug = slugify(title, id);

  const event = await db.event.create({
    data: {
      hostId: session.userId,
      communityId: communityId || null,
      title,
      slug,
      description: description || null,
      type,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      timezone,
      location: location || null,
      onlineUrl: onlineUrl || null,
      capacity: capacity ?? null,
      isPublic,
      coverImageUrl: coverImageUrl || null,
    },
  });

  return NextResponse.json({ success: true, data: event }, { status: 201 });
});
