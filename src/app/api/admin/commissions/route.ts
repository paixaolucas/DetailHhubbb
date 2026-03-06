// =============================================================================
// GET /api/admin/commissions — list CommissionTransactions (SUPER_ADMIN)
// Query: page, pageSize, status, communityId
// =============================================================================

import { NextResponse } from "next/server";
import { withRole } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { UserRole, CommissionTransactionStatus } from "@prisma/client";

export const GET = withRole(UserRole.SUPER_ADMIN)(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const statusParam = searchParams.get("status");
    const communityId = searchParams.get("communityId") ?? undefined;

    const status = statusParam && Object.values(CommissionTransactionStatus).includes(statusParam as CommissionTransactionStatus)
      ? (statusParam as CommissionTransactionStatus)
      : undefined;

    const where = {
      ...(status ? { status } : {}),
      ...(communityId ? { communityId } : {}),
    };

    const [total, items] = await Promise.all([
      db.commissionTransaction.count({ where }),
      db.commissionTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          community: { select: { id: true, name: true } },
          recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error("[Commissions GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
