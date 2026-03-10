// =============================================================================
// POST /api/auth/reset-password
// Verifies the stateless JWT reset token and updates the user's password
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { ZodError } from "zod";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Verify the reset token
    let payload: { sub?: string; type?: string };
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload as { sub?: string; type?: string };
    } catch {
      return NextResponse.json(
        { success: false, error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    if (payload.type !== "pw-reset" || !payload.sub) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, isBanned: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (!user.isActive || user.isBanned) {
      return NextResponse.json(
        { success: false, error: "Conta inativa ou suspensa" },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke all refresh tokens so all sessions are invalidated
    await db.refreshToken.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }
    console.error("[ResetPassword]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
