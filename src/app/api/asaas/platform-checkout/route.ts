export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createAsaasPlatformCheckout } from "@/services/payment/asaas-payment.service";
import { AppError } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withAuth(async (req, { session }) => {
  // Rate limit: 5 tentativas por minuto por usuário
  const rl = await checkRateLimit(`asaas-checkout:${session.userId}`, 60_000, 5);
  if (rl) return rl;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { platformPlanId, cpf } = body;

  if (!platformPlanId || typeof platformPlanId !== "string") {
    return NextResponse.json(
      { success: false, error: "platformPlanId obrigatório" },
      { status: 400 }
    );
  }
  if (!cpf || typeof cpf !== "string") {
    return NextResponse.json(
      { success: false, error: "CPF obrigatório" },
      { status: 400 }
    );
  }

  const cpfClean = cpf.replace(/\D/g, "");
  if (cpfClean.length !== 11) {
    return NextResponse.json(
      { success: false, error: "CPF inválido — deve ter 11 dígitos" },
      { status: 400 }
    );
  }

  try {
    const result = await createAsaasPlatformCheckout({
      userId: session.userId,
      platformPlanId,
      cpf: cpfClean,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error("[Asaas Checkout]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
