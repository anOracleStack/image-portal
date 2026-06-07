import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { persistPortalImage } from "@/lib/portal-image";
import { loadWorkshop } from "@/lib/portal-workshop";

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

  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("owner_id, title")
    .eq("id", portalId)
    .single();

  if (!portal || portal.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let useEnhanced = true;
  try {
    const body = await req.json();
    if (typeof body.useEnhanced === "boolean") useEnhanced = body.useEnhanced;
  } catch {
    // default useEnhanced=true
  }

  const state = await loadWorkshop(portal.owner_id, portalId);
  if (state.references.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one reference image before approving." },
      { status: 400 },
    );
  }

  const tryFiles =
    useEnhanced && state.enhanced
      ? [state.enhanced, state.references[0]]
      : [state.references[0]];

  let blob: Blob | null = null;
  for (const fileName of tryFiles) {
    if (!fileName) continue;
    const path = `${portal.owner_id}/${portalId}/${fileName}`;
    const { data, error: dlErr } = await db.storage
      .from("portal-images")
      .download(path);
    if (!dlErr && data) {
      blob = data;
      break;
    }
  }

  if (!blob) {
    return NextResponse.json(
      { error: "Workshop image missing — re-upload your reference." },
      { status: 404 },
    );
  }

  const buf = Buffer.from(await blob.arrayBuffer());

  try {
    await persistPortalImage({
      portalId,
      ownerId: portal.owner_id,
      buf,
      mimeType: "image/jpeg",
      activatePortal: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Approve failed";
    const status = msg.includes("near-duplicate") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({
    ok: true,
    message: `"${portal.title}" is live — viewers can scan your visual at rub.pub/scan.`,
  });
}
