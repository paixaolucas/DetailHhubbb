// =============================================================================
// POST /api/marketplace/checkout
// Creates a Stripe Checkout Session for a marketplace listing
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { db } from "@/lib/db";

export const POST = withAuth(async (req, { session }) => {
  try {
    const { listingId } = await req.json();

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { success: false, error: "listingId é obrigatório" },
        { status: 400 }
      );
    }

    const listing = await db.marketplaceListing.findUnique({
      where: { id: listingId, status: "ACTIVE" },
      select: { id: true, title: true, price: true, stripePriceId: true, coverImageUrl: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2024-06-20" as any,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const sessionParams: any = {
      mode: "payment",
      success_url: `${appUrl}/dashboard/marketplace?purchase=success`,
      cancel_url: `${appUrl}/dashboard/marketplace`,
      customer_email: session.email,
      metadata: {
        listingId: listing.id,
        userId: session.userId,
      },
    };

    if (listing.stripePriceId) {
      sessionParams.line_items = [{ price: listing.stripePriceId, quantity: 1 }];
    } else {
      sessionParams.line_items = [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: Math.round(Number(listing.price) * 100),
            product_data: {
              name: listing.title,
              ...(listing.coverImageUrl && { images: [listing.coverImageUrl] }),
            },
          },
        },
      ];
    }

    const checkoutSession = await stripeClient.checkout.sessions.create(sessionParams);

    return NextResponse.json({ success: true, checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error("[MarketplaceCheckout]", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar sessão de checkout" },
      { status: 500 }
    );
  }
});
