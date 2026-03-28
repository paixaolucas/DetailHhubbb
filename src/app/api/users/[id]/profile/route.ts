import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  socialLinks: z
    .object({
      website: z.string().url().optional().or(z.literal("")).optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
});

// GET — público, sem autenticação
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            bio: true,
            location: true,
            socialLinks: true,
            isPublic: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        headline: null,
        bio: user.profile?.bio ?? null,
        location: user.profile?.location ?? null,
        socialLinks: user.profile?.socialLinks ?? {},
        isPublic: user.profile?.isPublic ?? true,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH — protegido, usuário só edita seu próprio perfil
export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const userId = params?.id;
    if (!userId || userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { bio, location, socialLinks } = parsed.data;

    const profile = await db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: bio ?? undefined,
        location: location ?? undefined,
        socialLinks: socialLinks ?? {},
      },
      update: {
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(socialLinks !== undefined && { socialLinks }),
      },
      select: {
        bio: true,
        location: true,
        socialLinks: true,
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
