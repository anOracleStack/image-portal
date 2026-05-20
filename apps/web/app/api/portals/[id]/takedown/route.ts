import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const VALID_CLAIM_TYPES = ["ownership", "dmca", "trademark"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { claimType, evidenceUrl } = body as {
      claimType?: string;
      evidenceUrl?: string;
    };

    if (!claimType || !VALID_CLAIM_TYPES.includes(claimType as any)) {
      return NextResponse.json(
        {
          error: `claimType must be one of: ${VALID_CLAIM_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("takedowns")
      .insert({
        portal_id: id,
        claim_type: claimType,
        evidence_url: evidenceUrl?.trim() ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ takedown: data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
