// =============================================================================
// POST /api/admin/verify-seed-users
// One-time endpoint to set emailVerified on seed/test accounts.
// Protected by CRON_SECRET.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SEED_EMAILS = [
  "admin@comunidadehub.com",
  "barba@comunidade.com",
  "corujao@comunidade.com",
  "neto@comunidade.com",
  "membro1@email.com",
  "membro2@email.com",
  "joao@comunidade.com",
];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await db.user.updateMany({
    where: { email: { in: SEED_EMAILS } },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ success: true, data: { updated: result.count } });
}
