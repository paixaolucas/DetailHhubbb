import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum([
    "SUPER_ADMIN",
    "INFLUENCER_ADMIN",
    "COMMUNITY_MEMBER",
    "MARKETPLACE_PARTNER",
  ]),
});

export const PATCH = withRole(UserRole.SUPER_ADMIN)(
  async (req, { session, params }) => {
    try {
      const userId = params?.id;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "User ID required" },
          { status: 400 }
        );
      }

      // Prevent self-modification
      if (userId === session.userId) {
        return NextResponse.json(
          { success: false, error: "Não é possível alterar o próprio role" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const parsed = updateRoleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 422 }
        );
      }

      // Verify user exists before updating
      const existing = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      const user = await db.user.update({
        where: { id: userId },
        data: { role: parsed.data.role as UserRole },
        select: { id: true, role: true },
      });

      // Revoke all active refresh tokens so the new role takes effect immediately
      await db.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });

      return NextResponse.json({ success: true, data: user });
    } catch (error) {
      console.error("[User Role PATCH]", error);
      return NextResponse.json(
        { success: false, error: "Erro ao atualizar role" },
        { status: 500 }
      );
    }
  }
);
