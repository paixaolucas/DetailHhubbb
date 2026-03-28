import { NextRequest, NextResponse } from "next/server";
import { handleAsaasWebhookEvent } from "@/services/payment/asaas-payment.service";
import type { AsaasWebhookPayload } from "@/lib/asaas/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verificação do token de webhook Asaas
  // O Asaas envia o token configurado no header "asaas-access-token"
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error("[Asaas Webhook] ASAAS_WEBHOOK_TOKEN not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const receivedToken = req.headers.get("asaas-access-token");
  if (!receivedToken || receivedToken !== webhookToken) {
    return NextResponse.json(
      { error: "Invalid webhook token" },
      { status: 401 }
    );
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = (await req.json()) as AsaasWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleAsaasWebhookEvent(payload);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Asaas Webhook]", message, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
