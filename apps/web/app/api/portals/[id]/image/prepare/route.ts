import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  draftPublicUrl,
  draftRefName,
  loadWorkshop,
  regenerateEnhanced,
  saveWorkshop,
} from "@/lib/portal-workshop";

const MAX_MB = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 10);

/** Legacy single-file prepare — forwards into workshop storage. */
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

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("id, owner_id")
    .eq("id", portalId)
    .single();

  if (!portal || portal.owner_id !== user.id) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  let state = await loadWorkshop(portal.owner_id, portalId);
  const refName = draftRefName(state.references.length);
  const referenceBuf = Buffer.from(await file.arrayBuffer());
  const base = `${portal.owner_id}/${portalId}`;

  await db.storage.from("portal-images").upload(`${base}/${refName}`, referenceBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  state.references.push(refName);
  state = await regenerateEnhanced(portal.owner_id, portalId, state);
  await saveWorkshop(portal.owner_id, portalId, state);

  return NextResponse.json({
    ok: true,
    referencePreview: draftPublicUrl(portalId, refName),
    enhancedPreview: draftPublicUrl(portalId, state.enhanced),
    referenceUrls: state.references.map((f) => draftPublicUrl(portalId, f)),
    enhancedUrl: draftPublicUrl(portalId, state.enhanced),
    message: "Review the enhanced visual, then approve to go live.",
  });
}
