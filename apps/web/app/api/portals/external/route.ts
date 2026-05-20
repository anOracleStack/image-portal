import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createHash } from "crypto";
import { z } from "zod";

const RequestSchema = z.object({
  slug: z.string().min(1),
  action: z.enum(["info", "scan"]),
  image: z.string().optional(),
});

async function resolveApiKey(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKeyHeader = req.headers.get("x-api-key") ?? "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : apiKeyHeader;

  if (!token) return null;

  const hash = createHash("sha256").update(token).digest("hex");
  const db = createAdminClient();

  const { data: keyRecord } = await db
    .from("user_api_keys")
    .select("user_id, id")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!keyRecord) return null;

  // Update last_used_at
  await db
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return keyRecord.user_id;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveApiKey(req);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, action, image } = parsed.data;
    const db = createAdminClient();

    // Look up portal
    const { data: portal, error: portalErr } = await db
      .from("portals")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (portalErr) {
      return NextResponse.json({ error: portalErr.message }, { status: 500 });
    }
    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (action === "info") {
      return NextResponse.json({
        id: portal.id,
        title: portal.title,
        slug: portal.slug,
        destination_url: portal.destination_url,
        status: portal.status,
        scan_mode: portal.scan_mode,
        total_scans: portal.total_scans,
        created_at: portal.created_at,
      });
    }

    // action === "scan"
    if (!image) {
      return NextResponse.json({ error: "image field is required for scan action" }, { status: 400 });
    }

    // Trigger scan via the existing scan endpoint internally
    const scanUrl = new URL(req.url);
    scanUrl.pathname = "/api/scan";

    const scanResponse = await fetch(scanUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalId: portal.id,
        image,
        source: "api",
        sourceType: "unknown",
      }),
    });

    const scanResult = await scanResponse.json();

    return NextResponse.json({
      matched: scanResult.matched ?? false,
      confidence: scanResult.confidence ?? null,
      details: scanResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
