import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portalId, reason, details } = body as {
      portalId?: string;
      reason?: string;
      details?: string;
    };

    if (!portalId || typeof portalId !== "string") {
      return NextResponse.json(
        { error: "portalId is required" },
        { status: 400 }
      );
    }
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    // Capture the reporter if currently logged in (optional).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = createAdminClient();
    const { data, error } = await db
      .from("abuse_reports")
      .insert({
        portal_id: portalId,
        reporter_id: user?.id ?? null,
        reason: reason.trim(),
        details: details?.trim() ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
