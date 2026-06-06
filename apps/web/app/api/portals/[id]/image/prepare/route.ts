import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { enhanceImage } from "@ip/vision";

const MAX_MB = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 10);
const DRAFT_REF = "draft-reference.jpg";
const DRAFT_ENH = "draft-enhanced.jpg";

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

  const referenceBuf = Buffer.from(await file.arrayBuffer());
  const enhancedBuf = await enhanceImage(referenceBuf);
  const base = `${portal.owner_id}/${portalId}`;

  await db.storage.from("portal-images").upload(`${base}/${DRAFT_REF}`, referenceBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  await db.storage.from("portal-images").upload(`${base}/${DRAFT_ENH}`, enhancedBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });

  const refB64 = referenceBuf.toString("base64");
  const enhB64 = enhancedBuf.toString("base64");

  return NextResponse.json({
    ok: true,
    referencePreview: `data:image/jpeg;base64,${refB64}`,
    enhancedPreview: `data:image/jpeg;base64,${enhB64}`,
    message: "Review the enhanced visual, then approve to go live.",
  });
}
