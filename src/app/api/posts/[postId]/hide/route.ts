// =============================================================================
// PATCH /api/posts/[postId]/hide — toggle isHidden (community owner only)
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const PATCH = withAuth(async (req, { session, params }) => {
  try {
    const postId = params?.postId;
    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { communityId: true, isHidden: true },
    });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, post.communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.post.update({
      where: { id: postId },
      data: { isHidden: !post.isHidden },
      select: { id: true, isHidden: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
