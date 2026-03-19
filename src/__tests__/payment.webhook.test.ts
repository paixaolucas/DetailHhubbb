// =============================================================================
// STRIPE WEBHOOK ROUTE — Unit Tests
// Covers: signature check, missing env, success flow, error propagation
// handleWebhookEvent is mocked — we test the route handler logic only.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock payment service before importing the route
vi.mock("@/services/payment/payment.service", () => ({
  handleWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { handleWebhookEvent } from "@/services/payment/payment.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string, signature?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;

  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET env var is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = makeRequest("{}", "sig_test");
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/not configured/i);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = makeRequest("{}", undefined); // no signature
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/signature/i);
  });

  it("returns 200 with { received: true } when event is handled successfully", async () => {
    vi.mocked(handleWebhookEvent).mockResolvedValueOnce(undefined);

    const req = makeRequest("{}", "valid_stripe_signature");
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("returns 400 when handleWebhookEvent throws (e.g. invalid signature)", async () => {
    vi.mocked(handleWebhookEvent).mockRejectedValueOnce(
      new Error("No signatures found matching the expected signature for payload")
    );

    const req = makeRequest("{}", "bad_signature");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("No signatures found");
  });

  it("calls handleWebhookEvent with a Buffer payload and the stripe-signature", async () => {
    const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: {} } });
    vi.mocked(handleWebhookEvent).mockResolvedValueOnce(undefined);

    const req = makeRequest(payload, "t=1234,v1=abcdef");
    await POST(req);

    expect(handleWebhookEvent).toHaveBeenCalledOnce();

    const [calledBuffer, calledSig] = vi.mocked(handleWebhookEvent).mock.calls[0];
    expect(Buffer.isBuffer(calledBuffer)).toBe(true);
    expect(calledSig).toBe("t=1234,v1=abcdef");
  });

  it("propagates the error message in the response body on failure", async () => {
    vi.mocked(handleWebhookEvent).mockRejectedValueOnce(new Error("Webhook Error: test error"));

    const req = makeRequest("{}", "sig");
    const res = await POST(req);
    const json = await res.json();

    expect(json.error).toBe("Webhook Error: test error");
  });
});
