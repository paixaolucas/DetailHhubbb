// =============================================================================
// GET /api/users — SUPER_ADMIN only
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req, { session }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role") as UserRole | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));

    const where: any = {
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(role ? { role } : {}),
    };

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        lastLoginAt: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("[Users GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
