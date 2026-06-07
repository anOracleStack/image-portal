import { NextRequest, NextResponse } from "next/server";
import { destinationUrlErrorMessage, validateDestination } from "@ip/shared";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  enforceGalleryVisibility,
  getUserSubscription,
} from "@/lib/subscription";
import { checkSafeBrowsing } from "@/lib/safe-browsing";

// ---------------------------------------------------------------------------
// GET — fetch a single portal by ID (with ownership check)
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createAdminClient();
    const { data: portal, error } = await db
      .from("portals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (portal.owner_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ portal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const db = createAdminClient();

    const { data: existing, error: loadErr } = await db
      .from("portals")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (loadErr || !existing) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const allowed = [
      "title",
      "destination_url",
      "visibility",
      "status",
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (updates.visibility !== undefined) {
      const sub = await getUserSubscription(user.id, user.email);
      updates.visibility = enforceGalleryVisibility(
        sub.plan_tier,
        updates.visibility as "public" | "private"
      );
    }

    if (updates.destination_url !== undefined) {
      const raw = String(updates.destination_url);
      const verdict = validateDestination(raw);
      if (!verdict.ok) {
        return NextResponse.json(
          { error: destinationUrlErrorMessage(verdict.reason) },
          { status: 422 }
        );
      }
      const sb = await checkSafeBrowsing(verdict.normalized);
      if (!sb.safe) {
        return NextResponse.json(
          { error: `URL blocked: ${sb.threats.join(", ")}` },
          { status: 422 }
        );
      }
      updates.destination_url = verdict.normalized;
    }

    const { data: portal, error } = await db
      .from("portals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ portal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createAdminClient();

    // Delete dependent records first (portal_images, fingerprints via CASCADE
    // should handle this if FK constraints are set, but we do it explicitly
    // for safety).
    await db.from("portal_images").delete().eq("portal_id", id);
    await db.from("fingerprints").delete().eq("portal_id", id);

    const { error } = await db.from("portals").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "toggle_status") {
      const db = createAdminClient();
      const { data: portal } = await db
        .from("portals")
        .select("status")
        .eq("id", id)
        .single();

      if (!portal) {
        return NextResponse.json({ error: "Portal not found" }, { status: 404 });
      }

      const newStatus = portal.status === "active" ? "inactive" : "active";
      const { data: updated, error } = await db
        .from("portals")
        .update({ status: newStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ portal: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
