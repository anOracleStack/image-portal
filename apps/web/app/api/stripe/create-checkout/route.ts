import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, successUrl, cancelUrl } = (await req.json()) as {
      priceId?: string;
      userId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "priceId and userId are required" },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Check if the user already has a Stripe customer ID on file.
    const db = createAdminClient();
    const { data: existing } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
      success_url: successUrl ?? `${appUrl}/dashboard?checkout=success`,
      cancel_url: cancelUrl ?? `${appUrl}/pricing`,
    };

    if (existing?.stripe_customer_id) {
      sessionParams.customer = existing.stripe_customer_id;
    } else {
      sessionParams.customer_creation = "always";
    }

    const session = await stripe().checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error", err);
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
