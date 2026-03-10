// =============================================================================
// GET /api/communities/[id]/plans
// POST /api/communities/[id]/plans
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { createPlanRouteSchema as createPlanSchema } from "@/lib/validations/community";

export const GET = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const plans = await db.subscriptionPlan.findMany({
      where: { communityId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("[Plans GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    if (!communityId) {
      return NextResponse.json({ success: false, error: "Community ID required" }, { status: 400 });
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const existingCount = await db.subscriptionPlan.count({ where: { communityId } });

    const plan = await db.subscriptionPlan.create({
      data: {
        communityId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        interval: parsed.data.interval,
        intervalCount: parsed.data.intervalCount,
        features: parsed.data.features,
        trialDays: parsed.data.trialDays,
        isDefault: parsed.data.isDefault,
        sortOrder: existingCount,
      },
    });

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    console.error("[Plans POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
