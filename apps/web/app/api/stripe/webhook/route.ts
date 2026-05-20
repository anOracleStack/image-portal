import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { mapPriceIdToTier } from "@/lib/stripe-plans";
import { createAdminClient } from "@/lib/supabase-admin";

async function upsertSubscription(payload: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planTier: string;
  status: string;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const db = createAdminClient();
  const { data: row } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", payload.userId)
    .maybeSingle();

  const periodStart = payload.currentPeriodStart
    ? new Date(payload.currentPeriodStart * 1000).toISOString()
    : null;
  const periodEnd = payload.currentPeriodEnd
    ? new Date(payload.currentPeriodEnd * 1000).toISOString()
    : null;

  if (row) {
    await db
      .from("subscriptions")
      .update({
        stripe_customer_id: payload.stripeCustomerId,
        stripe_subscription_id: payload.stripeSubscriptionId,
        plan_tier: payload.planTier,
        status: payload.status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: payload.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  } else {
    await db.from("subscriptions").insert({
      user_id: payload.userId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      plan_tier: payload.planTier,
      status: payload.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: payload.cancelAtPeriodEnd ?? false,
    });
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    const db = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.userId ?? session.client_reference_id;

        if (!userId) {
          console.error("checkout.session.completed missing userId", session.id);
          break;
        }

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        let periodStart: number | null = null;
        let periodEnd: number | null = null;

        let priceId: string | undefined;

        if (subscriptionId) {
          try {
            const sub = await stripe().subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });
            periodStart = sub.items.data[0]?.current_period_start ?? null;
            periodEnd = sub.items.data[0]?.current_period_end ?? null;
            priceId = sub.items.data[0]?.price?.id;
          } catch {
            // subscription may not be immediately available
          }
        }

        await upsertSubscription({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          planTier: priceId ? mapPriceIdToTier(priceId) : "free",
          status:
            session.status === "complete" || session.payment_status === "paid"
              ? "active"
              : "incomplete",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        // Ensure a subscription_usage row exists for the current month.
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        await db.from("subscription_usage").upsert(
          { user_id: userId, month, scan_count: 0, portal_count: 0 },
          { onConflict: "user_id,month" },
        );

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
        if (!subscriptionId) break;

        const sub = await stripe().subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });
        const periodStart = sub.items.data[0]?.current_period_start ?? null;
        const periodEnd = sub.items.data[0]?.current_period_end ?? null;
        const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;

        const { data: subsRows } = await db
          .from("subscriptions")
          .select("id, user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .limit(1);

        if (subsRows?.[0]) {
          await db
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: cancelAtPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subsRows[0].id);

          // Reset monthly usage counters on renewal.
          const now = new Date();
          const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
          await db.from("subscription_usage").upsert(
            {
              user_id: subsRows[0].user_id,
              month,
              scan_count: 0,
              portal_count: 0,
            },
            { onConflict: "user_id,month" },
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
        if (!subscriptionId) break;

        await db
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const priceId = sub.items.data[0]?.price?.id;
        const periodStart = sub.items.data[0]?.current_period_start ?? null;
        const periodEnd = sub.items.data[0]?.current_period_end ?? null;

        const { data: subsRows } = await db
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .limit(1);

        if (subsRows?.[0]) {
          await db
            .from("subscriptions")
            .update({
              status: sub.status,
              plan_tier: priceId ? mapPriceIdToTier(priceId) : "free",
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subsRows[0].id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const { data: subsRows } = await db
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .limit(1);

        if (subsRows?.[0]) {
          await db
            .from("subscriptions")
            .update({
              status: "canceled",
              plan_tier: "free",
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subsRows[0].id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook handler error", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
