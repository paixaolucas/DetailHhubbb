import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";
import { cancelAsaasSubscription } from "@/services/payment/asaas-payment.service";
import { AppError } from "@/types";

// GET — retorna dados da assinatura atual do usuário logado
export const GET = withAuth(async (_req, { session }) => {
  const membership = await db.platformMembership.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      asaasSubscriptionId: true,
      plan: {
        select: { name: true, price: true, interval: true },
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { success: false, error: "Nenhuma assinatura encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: membership });
});

// DELETE — cancela a assinatura Asaas do usuário logado
export const DELETE = withAuth(async (_req, { session }) => {
  try {
    await cancelAsaasSubscription(session.userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error("[Asaas] Cancel subscription route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
