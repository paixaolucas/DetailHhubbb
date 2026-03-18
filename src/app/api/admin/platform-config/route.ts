// =============================================================================
// GET /api/admin/platform-config — read platform config (SUPER_ADMIN)
// PUT /api/admin/platform-config — upsert platform config (SUPER_ADMIN)
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const DEFAULT_FLAGS = {
  cadastros: true,
  marketplace: true,
  lives: true,
  ia: true,
  manutencao: false,
};

const DEFAULT_CONFIG = {
  nomePlataforma: "Detailer'HUB",
  emailSuporte: "suporte@detailhub.com",
  comissao: "15",
};

const putSchema = z.object({
  flags: z.record(z.boolean()).optional(),
  config: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const GET = withRole(UserRole.SUPER_ADMIN)(async () => {
  try {
    const row = await db.platformConfig.findUnique({ where: { id: "singleton" } });

    if (!row) {
      const created = await db.platformConfig.create({
        data: { id: "singleton", flags: DEFAULT_FLAGS, config: DEFAULT_CONFIG },
      });
      return NextResponse.json({ success: true, data: { flags: created.flags, config: created.config } });
    }

    return NextResponse.json({ success: true, data: { flags: row.flags, config: row.config } });
  } catch (error) {
    console.error("[PlatformConfig GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withRole(UserRole.SUPER_ADMIN)(async (req) => {
  try {
    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 422 });
    }

    const updateData: { flags?: object; config?: object } = {};
    if (parsed.data.flags !== undefined) updateData.flags = parsed.data.flags;
    if (parsed.data.config !== undefined) updateData.config = parsed.data.config;

    const row = await db.platformConfig.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        flags: parsed.data.flags ?? DEFAULT_FLAGS,
        config: parsed.data.config ?? DEFAULT_CONFIG,
      },
    });

    return NextResponse.json({ success: true, data: { flags: row.flags, config: row.config } });
  } catch (error) {
    console.error("[PlatformConfig PUT]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
