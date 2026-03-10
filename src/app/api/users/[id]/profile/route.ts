// =============================================================================
// GET  /api/users/[id]/profile — Public user profile (no auth required)
// PATCH /api/users/[id]/profile — Update own profile (auth required)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getSessionFromRequest } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

// ─── Validation ───────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  carBrand: z.string().max(60).optional(),
  carModel: z.string().max(60).optional(),
  carYear: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional().nullable(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  isPublic: z.boolean().optional(),
});

// ─── GET — Public profile ─────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            role: true,
          },
        },
      },
    });

    // Profile not created yet — return null data, not 404
    if (!profile) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("[UserProfile GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH — Update own profile ───────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Manually extract session so we can return 401 without wrapping the whole
  // function in withAuth (which doesn't accept params from Next.js context)
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = params;

  // Users can only update their own profile
  if (session.userId !== id) {
    return NextResponse.json(
      { success: false, error: "Forbidden: cannot update another user's profile" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const profile = await db.userProfile.upsert({
      where: { userId: id },
      update: { ...data },
      create: { userId: id, ...data },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("[UserProfile PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
