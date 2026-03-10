// =============================================================================
// GET /api/search
// Global search across communities, posts, and members
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  RATE_LIMIT,
  MAX_SEARCH_QUERY_LENGTH,
  VALID_SEARCH_TYPES,
  type SearchType,
} from "@/lib/constants";

export const GET = withAuth(async (req: NextRequest, { session }) => {
  const limited = checkRateLimit(
    `search:${session.userId}`,
    RATE_LIMIT.SEARCH.windowMs,
    RATE_LIMIT.SEARCH.max
  );
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const typesParam = searchParams.get("types");

    // Validate query length
    if (q.length < 2) {
      return NextResponse.json(
        { success: false, error: "A busca deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }
    if (q.length > MAX_SEARCH_QUERY_LENGTH) {
      return NextResponse.json(
        { success: false, error: `A busca deve ter no máximo ${MAX_SEARCH_QUERY_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    // Validate and sanitize types
    const requestedTypes = typesParam
      ? typesParam.split(",").map((t) => t.trim())
      : [...VALID_SEARCH_TYPES];

    const types = requestedTypes.filter((t): t is SearchType =>
      (VALID_SEARCH_TYPES as readonly string[]).includes(t)
    );

    if (types.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tipos de busca inválidos" },
        { status: 400 }
      );
    }

    // Get communities user has access to (platform membership or direct membership)
    const platformMembership = await db.platformMembership.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { id: true },
    });

    let allowedCommunityIds: string[] | undefined;
    if (!platformMembership) {
      // Only get communities from direct memberships
      const memberships = await db.communityMembership.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        select: { communityId: true },
      });
      allowedCommunityIds = memberships.map((m) => m.communityId);
    }

    const results = await Promise.all([
      // Communities
      types.includes("communities")
        ? db.community.findMany({
            where: {
              isPublished: true,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              shortDescription: true,
              memberCount: true,
            },
            take: 5,
          })
        : [],

      // Posts
      types.includes("posts")
        ? db.post.findMany({
            where: {
              isHidden: false,
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { body: { contains: q, mode: "insensitive" } },
              ],
              ...(allowedCommunityIds !== undefined ? {
                space: { communityId: { in: allowedCommunityIds } },
              } : {}),
            },
            select: {
              id: true,
              title: true,
              body: true,
              createdAt: true,
              author: { select: { firstName: true, lastName: true } },
              space: {
                select: {
                  name: true,
                  community: { select: { slug: true } },
                },
              },
            },
            take: 5,
          })
        : [],

      // Members — no email or role in results
      types.includes("members")
        ? db.user.findMany({
            where: {
              isActive: true,
              isBanned: false,
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
            take: 5,
          })
        : [],
    ]);

    const communities = results[0] as Awaited<ReturnType<typeof db.community.findMany>>;
    const posts = results[1] as Awaited<ReturnType<typeof db.post.findMany>>;
    const members = results[2] as Awaited<ReturnType<typeof db.user.findMany>>;

    return NextResponse.json({
      success: true,
      data: {
        communities,
        posts,
        members,
        total: communities.length + posts.length + members.length,
      },
    });
  } catch (error) {
    console.error("[Search GET]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
});
