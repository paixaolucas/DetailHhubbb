import { NextResponse } from "next/server";
import { withAuth, verifyPlatformMembership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  const hasMembership = await verifyPlatformMembership(session.userId);
  if (!hasMembership) {
    return NextResponse.json(
      { success: false, error: "Platform membership required" },
      { status: 403 }
    );
  }

  const spaces = await db.space.findMany({
    where: {
      community: { isPublished: true },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      type: true,
      sortOrder: true,
      communityId: true,
      community: {
        select: {
          slug: true,
          name: true,
          logoUrl: true,
        },
      },
    },
    orderBy: [
      { community: { name: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  const result = spaces.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    type: s.type,
    sortOrder: s.sortOrder,
    communityId: s.communityId,
    communitySlug: s.community.slug,
    communityName: s.community.name,
    communityLogoUrl: s.community.logoUrl,
  }));

  return NextResponse.json({ success: true, data: result });
});
