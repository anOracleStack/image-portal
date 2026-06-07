import { NextRequest, NextResponse } from "next/server";
import { CreatePortalInput, validateDestination, destinationUrlErrorMessage } from "@ip/shared";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { ensureProfile, ProfileEnsureError } from "@/lib/ensure-profile";
import { checkPortalLimit, enforceGalleryVisibility, getUserSubscription } from "@/lib/subscription";
import { checkSafeBrowsing } from "@/lib/safe-browsing";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreatePortalInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, destinationUrl, scanMode, visibility: requestedVisibility } =
      parsed.data;
    const ownerId = user.id;

    const sub = await getUserSubscription(ownerId);
    const visibility = enforceGalleryVisibility(
      sub.plan_tier,
      requestedVisibility
    );

    await ensureProfile(ownerId, {
      displayName: user.user_metadata?.full_name ?? user.user_metadata?.name,
    });

    const verdict = validateDestination(destinationUrl);
    if (!verdict.ok) {
      return NextResponse.json({ error: destinationUrlErrorMessage(verdict.reason) }, { status: 422 });
    }
    const sb = await checkSafeBrowsing(verdict.normalized);
    if (!sb.safe) {
      return NextResponse.json(
        { error: `URL blocked: ${sb.threats.join(", ")}` },
        { status: 422 }
      );
    }

    // Check portal creation limit
    const limit = await checkPortalLimit(ownerId);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason, upgrade: true },
        { status: 403 }
      );
    }

    const db = createAdminClient();

    // Generate a unique slug
    let slug = slugify(title);
    if (!slug) slug = "portal";

    // Check for collisions
    const { data: existing } = await db
      .from("portals")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      let n = 1;
      let candidate: string;
      do {
        candidate = `${slug}-${n}`;
        const { data: taken } = await db
          .from("portals")
          .select("slug")
          .eq("slug", candidate)
          .maybeSingle();
        if (!taken) break;
        n++;
      } while (n < 1000);
      slug = candidate;
    }

    const { data: portal, error: insertErr } = await db
      .from("portals")
      .insert({
        owner_id: ownerId,
        title,
        slug,
        destination_url: verdict.normalized,
        scan_mode: scanMode,
        visibility,
        status: "inactive",
        total_scans: 0,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23503" && insertErr.message.includes("portals_owner_id_fkey")) {
        return NextResponse.json(
          {
            error:
              "Your account profile is missing. Sign out, sign in again, and retry. If this persists, contact support.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Track portal count for this billing month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    await db.rpc("increment_portal_count", {
      p_user_id: ownerId,
      p_month: month,
    });

    return NextResponse.json({ portal }, { status: 201 });
  } catch (err) {
    if (err instanceof ProfileEnsureError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
