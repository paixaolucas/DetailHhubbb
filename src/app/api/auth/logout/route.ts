// =============================================================================
// POST /api/auth/logout
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/services/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get("detailhub_refresh_token")?.value;
    const refreshToken = body.refreshToken ?? cookieToken;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    response.cookies.delete("detailhub_access_token");
    response.cookies.delete("detailhub_refresh_token");

    return response;
  } catch {
    // Always succeed logout on client side
    const response = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );
    response.cookies.delete("detailhub_access_token");
    response.cookies.delete("detailhub_refresh_token");
    return response;
  }
}
