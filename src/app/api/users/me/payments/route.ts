import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(10, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));

  const where = { userId: session.userId, type: "SUBSCRIPTION" as const };

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        stripeInvoiceId: true,
        description: true,
        createdAt: true,
      },
    }),
    db.payment.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: payments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
