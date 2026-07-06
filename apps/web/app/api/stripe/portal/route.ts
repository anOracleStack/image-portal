import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(_req: NextRequest) {
  try {
    // Derive the customer from the authenticated session — never trust a
    // client-supplied userId (that let anyone open any user's billing portal).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const db = createAdminClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No customer record found for this user" },
        { status: 400 },
      );
    }

    const appUrl = getAppUrl();

    const session = await stripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("portal error", err);
    const message =
      err instanceof Error ? err.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
