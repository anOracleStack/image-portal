import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  draftPublicUrl,
  draftRefName,
  loadWorkshop,
  normalizeReferenceImage,
  regenerateEnhanced,
  saveWorkshop,
  type WorkshopState,
} from "@/lib/portal-workshop";
import { workshopAssistantReply } from "@/lib/assistant";

const MAX_MB = Number(process.env.MAX_IMAGE_UPLOAD_MB ?? 10);

async function assertOwner(portalId: string, userId: string) {
  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("id, owner_id")
    .eq("id", portalId)
    .single();
  if (!portal || portal.owner_id !== userId) return null;
  return portal;
}

function serializeState(portalId: string, state: WorkshopState) {
  return {
    references: state.references.map((f) => draftPublicUrl(portalId, f)),
    enhancedUrl: state.references.length
      ? draftPublicUrl(portalId, state.enhanced)
      : null,
    messages: state.messages,
    useEnhanced: state.useEnhanced,
    hasReferences: state.references.length > 0,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: portalId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portal = await assertOwner(portalId, user.id);
  if (!portal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const state = await loadWorkshop(portal.owner_id, portalId);
  return NextResponse.json(serializeState(portalId, state));
}

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

  const portal = await assertOwner(portalId, user.id);
  if (!portal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  let state = await loadWorkshop(portal.owner_id, portalId);
  const db = createAdminClient();
  const base = `${portal.owner_id}/${portalId}`;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_MB * 1024 * 1024) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }
    }

    const added: string[] = [];
    for (const file of files) {
      const refName = draftRefName(state.references.length);
      let buf: Buffer;
      try {
        buf = await normalizeReferenceImage(Buffer.from(await file.arrayBuffer()));
      } catch {
        return NextResponse.json(
          {
            error:
              "Could not read that image — try JPEG or PNG, or re-save the photo from your camera roll.",
          },
          { status: 400 },
        );
      }

      const { error: uploadError } = await db.storage
        .from("portal-images")
        .upload(`${base}/${refName}`, buf, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 },
        );
      }

      state.references.push(refName);
      added.push(refName);
    }

    // Persist references before enhancement so a processing failure does not lose uploads.
    await saveWorkshop(portal.owner_id, portalId, state);

    let enhanceFailed = false;
    try {
      state = await regenerateEnhanced(portal.owner_id, portalId, state);
      state.messages.push({
        role: "assistant",
        content: `Added ${added.length} image${added.length === 1 ? "" : "s"} (${state.references.length} total). Enhanced preview is ready — tell me if you want changes, or approve when it looks right.`,
        at: new Date().toISOString(),
      });
    } catch (enhanceErr) {
      enhanceFailed = true;
      const detail =
        enhanceErr instanceof Error ? enhanceErr.message : "enhancement failed";
      state.messages.push({
        role: "assistant",
        content: `Saved ${added.length} reference image${added.length === 1 ? "" : "s"}, but the enhanced preview could not be generated (${detail}). Your uploads are safe — try uploading again or approve with the reference.`,
        at: new Date().toISOString(),
      });
    }

    await saveWorkshop(portal.owner_id, portalId, state);

    return NextResponse.json({
      ok: true,
      enhanceFailed,
      ...serializeState(portalId, state),
    });
  }

  const body = await req.json();
  const action = body.action as string | undefined;

  if (action === "chat") {
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    state.messages.push({ role: "user", content: message, at: new Date().toISOString() });
    const history = state.messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const { reply, adjust, wantsApprove } = await workshopAssistantReply(
      message,
      state.references.length,
      history,
    );

    if (adjust && state.references.length > 0) {
      state.enhanceOpts = { ...state.enhanceOpts, ...adjust };
      state = await regenerateEnhanced(portal.owner_id, portalId, state);
    }

    state.messages.push({ role: "assistant", content: reply, at: new Date().toISOString() });
    await saveWorkshop(portal.owner_id, portalId, state);

    return NextResponse.json({
      ok: true,
      wantsApprove,
      ...serializeState(portalId, state),
    });
  }

  if (action === "set_use_enhanced") {
    state.useEnhanced = Boolean(body.useEnhanced);
    await saveWorkshop(portal.owner_id, portalId, state);
    return NextResponse.json({ ok: true, ...serializeState(portalId, state) });
  }

  if (action === "remove_reference") {
    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= state.references.length) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }
    state.references.splice(index, 1);
    if (state.references.length > 0) {
      state = await regenerateEnhanced(portal.owner_id, portalId, state);
    }
    await saveWorkshop(portal.owner_id, portalId, state);
    return NextResponse.json({ ok: true, ...serializeState(portalId, state) });
  }

  if (action === "regenerate") {
    if (state.references.length === 0) {
      return NextResponse.json({ error: "Upload references first" }, { status: 400 });
    }
    state = await regenerateEnhanced(portal.owner_id, portalId, state);
    state.messages.push({
      role: "assistant",
      content: "Regenerated the enhanced preview from your references.",
      at: new Date().toISOString(),
    });
    await saveWorkshop(portal.owner_id, portalId, state);
    return NextResponse.json({ ok: true, ...serializeState(portalId, state) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
