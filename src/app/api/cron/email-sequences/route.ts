// =============================================================================
// GET /api/cron/email-sequences
// Process pending email sequence enrollments. Protected by CRON_SECRET header.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/email/resend";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const enrollments = await db.sequenceEnrollment.findMany({
      where: {
        isActive: true,
        nextSendAt: { lte: now },
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        sequence: {
          include: {
            steps: { orderBy: { stepNumber: "asc" } },
          },
        },
      },
      take: 100,
    });

    let processed = 0;
    let failed = 0;

    await Promise.allSettled(
      enrollments.map(async (enrollment) => {
        try {
          const { sequence, user, currentStep } = enrollment;
          const nextStepNumber = currentStep + 1;
          const step = sequence.steps.find((s) => s.stepNumber === nextStepNumber);

          if (!step) {
            // No more steps — deactivate enrollment
            await db.sequenceEnrollment.update({
              where: { id: enrollment.id },
              data: { isActive: false },
            });
            return;
          }

          if (resend) {
            await resend.emails.send({
              from: FROM_EMAIL,
              to: user.email,
              subject: step.subject,
              html: step.bodyHtml,
              text: step.bodyText ?? undefined,
            });
          } else {
            console.log(`[Cron Email] skip send (no RESEND_API_KEY) to=${user.email} subject="${step.subject}"`);
          }

          // Find the next step after this one to compute nextSendAt
          const followingStep = sequence.steps.find(
            (s) => s.stepNumber === nextStepNumber + 1
          );

          const nextSendAt = followingStep
            ? new Date(now.getTime() + followingStep.delayDays * 24 * 60 * 60 * 1000)
            : null;

          await db.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentStep: nextStepNumber,
              nextSendAt,
              isActive: !!followingStep,
            },
          });

          processed++;
        } catch (err) {
          console.error("[Cron Email Sequences] enrollment", enrollment.id, err);
          failed++;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: { processed, failed, total: enrollments.length },
    });
  } catch (error) {
    console.error("[Cron Email Sequences]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};
