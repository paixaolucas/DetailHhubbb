// =============================================================================
// STRIPE CLIENT SINGLETON — lazy initialization
// =============================================================================

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      typescript: true,
      appInfo: {
        name: "Comunidade Hub",
        version: "1.0.0",
      },
    });
  }
  return _stripe;
}

// Backward-compatible proxy — acessa stripe.X como antes,
// mas só inicializa quando realmente chamado (não no module load)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? null;
