// =============================================================================
// POST /api/admin/revalidate — revalidate Next.js cache (SUPER_ADMIN)
// =============================================================================

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/middleware/auth.middleware";
import { UserRole } from "@prisma/client";

export const POST = withRole(UserRole.SUPER_ADMIN)(async () => {
  try {
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Revalidate POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
