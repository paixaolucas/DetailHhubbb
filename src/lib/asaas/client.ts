// =============================================================================
// ASAAS HTTP CLIENT — thin fetch wrapper
// =============================================================================

import type {
  AsaasCustomer,
  AsaasCreateCustomerInput,
  AsaasCreateSubscriptionInput,
  AsaasSubscription,
  AsaasPayment,
  AsaasPixQrCode,
} from "./types";

function getBaseUrl(): string {
  const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY not configured");
  return key;
}

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asaas API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// =============================================================================
// CUSTOMERS
// =============================================================================

export async function findOrCreateCustomer(
  input: AsaasCreateCustomerInput
): Promise<AsaasCustomer> {
  // Tenta encontrar cliente existente pelo email
  const existing = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(input.email)}&limit=1`
  );
  if (existing.data.length > 0) return existing.data[0];

  // Cria novo cliente
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export async function createSubscription(
  input: AsaasCreateSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getSubscription(
  subscriptionId: string
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  await asaasFetch<void>(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// PAYMENTS
// =============================================================================

export async function getSubscriptionPayments(
  subscriptionId: string
): Promise<AsaasPayment[]> {
  const res = await asaasFetch<{ data: AsaasPayment[] }>(
    `/payments?subscription=${subscriptionId}&limit=10`
  );
  return res.data;
}

export async function getPixQrCode(
  paymentId: string
): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
