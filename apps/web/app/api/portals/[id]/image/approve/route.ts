import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { persistPortalImage } from "@/lib/portal-image";
import { DRAFT_ENH, loadWorkshop } from "@/lib/portal-workshop";

const DRAFT_REF_LEGACY = "draft-reference.jpg";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: portalId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { useEnhanced?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("id, owner_id, status")
    .eq("id", portalId)
    .single();

  if (!portal || portal.owner_id !== user.id) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const workshop = await loadWorkshop(portal.owner_id, portalId);
  const useEnhanced =
    typeof body.useEnhanced === "boolean" ? body.useEnhanced : workshop.useEnhanced;

  const draftName = useEnhanced
    ? DRAFT_ENH
    : workshop.references[0] ?? DRAFT_REF_LEGACY;
  const path = `${portal.owner_id}/${portalId}/${draftName}`;
  const { data: blob, error: dlErr } = await db.storage
    .from("portal-images")
    .download(path);

  if (dlErr || !blob) {
    return NextResponse.json(
      { error: "No draft image — upload or capture first." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await blob.arrayBuffer());

  try {
    const { imageId, quality_score } = await persistPortalImage({
      portalId,
      ownerId: portal.owner_id,
      buf,
      mimeType: "image/jpeg",
      activatePortal: true,
    });

    return NextResponse.json({
      ok: true,
      imageId,
      quality_score,
      status: "active",
      message: "Portal is live. Share the export or let viewers scan at rub.pub/scan.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "approve failed";
    const status = msg.includes("near-duplicate") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
