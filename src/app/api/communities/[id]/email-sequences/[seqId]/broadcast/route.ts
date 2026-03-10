// =============================================================================
// POST /api/communities/[id]/email-sequences/[seqId]/broadcast
// Send a one-off email to all active community members
// =============================================================================

import { NextResponse } from "next/server";
import { withAuth, verifyCommunityOwnership } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { z } from "zod";

const broadcastSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
});

export const POST = withAuth(async (req, { session, params }) => {
  try {
    const communityId = params?.id;
    const seqId = params?.seqId;
    if (!communityId || !seqId) {
      return NextResponse.json(
        { success: false, error: "Community ID and Sequence ID required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyCommunityOwnership(session.userId, communityId, session.role);
    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 422 }
      );
    }

    const { subject, body: emailBody } = parsed.data;

    const memberships = await db.communityMembership.findMany({
      where: { communityId, status: "ACTIVE" },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    let sentCount = 0;
    const errors: string[] = [];

    await Promise.allSettled(
      memberships.map(async (membership) => {
        const { email, firstName, lastName } = membership.user;
        try {
          if (resend) {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: email,
              subject,
              html: `<p>Olá, ${firstName} ${lastName}!</p>${emailBody}`,
              text: `Olá, ${firstName} ${lastName}!\n\n${emailBody}`,
            });
          }
          sentCount++;
        } catch (err) {
          errors.push(email);
          console.error("[Broadcast] Failed to send to", email, err);
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        total: memberships.length,
        sent: sentCount,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("[Email Broadcast POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
