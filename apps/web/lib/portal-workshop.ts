import { createAdminClient } from "@/lib/supabase-admin";
import { enhanceImage, type EnhanceOptions } from "@ip/vision";
import sharp from "sharp";

export const WORKSHOP_MANIFEST = "workshop.json";
export const DRAFT_ENH = "draft-enhanced.jpg";
export const DRAFT_REF_PREFIX = "draft-ref-";

export type WorkshopMessage = {
  role: "user" | "assistant";
  content: string;
  at: string;
};

export type WorkshopState = {
  references: string[];
  enhanced: string;
  messages: WorkshopMessage[];
  enhanceOpts: EnhanceOptions;
  useEnhanced: boolean;
};

export function draftRefName(index: number): string {
  return `${DRAFT_REF_PREFIX}${index}.jpg`;
}

/** Normalize camera / upload bytes to JPEG for storage (handles PNG, WebP, HEIC when supported). */
export async function normalizeReferenceImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none" })
    .rotate()
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export function workshopBase(ownerId: string, portalId: string): string {
  return `${ownerId}/${portalId}`;
}

export function defaultWorkshopState(): WorkshopState {
  return {
    references: [],
    enhanced: DRAFT_ENH,
    messages: [
      {
        role: "assistant",
        content:
          "Upload one or more reference images (photo, mockup, or scan). I'll analyze them and produce an enhanced version for you to review. Tell me if you want it brighter, sharper, or higher contrast — or approve when you're happy.",
        at: new Date().toISOString(),
      },
    ],
    enhanceOpts: {},
    useEnhanced: true,
  };
}

export async function loadWorkshop(
  ownerId: string,
  portalId: string,
): Promise<WorkshopState> {
  const db = createAdminClient();
  const path = `${workshopBase(ownerId, portalId)}/${WORKSHOP_MANIFEST}`;
  const { data, error } = await db.storage.from("portal-images").download(path);
  if (error || !data) return defaultWorkshopState();
  try {
    const parsed = JSON.parse(await data.text()) as WorkshopState;
    return {
      ...defaultWorkshopState(),
      ...parsed,
      messages: parsed.messages?.length ? parsed.messages : defaultWorkshopState().messages,
    };
  } catch {
    return defaultWorkshopState();
  }
}

export async function saveWorkshop(
  ownerId: string,
  portalId: string,
  state: WorkshopState,
): Promise<void> {
  const db = createAdminClient();
  const path = `${workshopBase(ownerId, portalId)}/${WORKSHOP_MANIFEST}`;
  await db.storage.from("portal-images").upload(
    path,
    Buffer.from(JSON.stringify(state)),
    { contentType: "application/json", upsert: true },
  );
}

export async function regenerateEnhanced(
  ownerId: string,
  portalId: string,
  state: WorkshopState,
): Promise<WorkshopState> {
  if (state.references.length === 0) {
    throw new Error("Upload at least one reference image first.");
  }

  const db = createAdminClient();
  const base = workshopBase(ownerId, portalId);
  const primary = state.references[0];
  const { data: blob, error } = await db.storage
    .from("portal-images")
    .download(`${base}/${primary}`);
  if (error || !blob) throw new Error("Reference image missing — upload again.");

  const referenceBuf = Buffer.from(await blob.arrayBuffer());
  const enhancedBuf = await enhanceImage(referenceBuf, state.enhanceOpts);

  await db.storage.from("portal-images").upload(`${base}/${DRAFT_ENH}`, enhancedBuf, {
    contentType: "image/jpeg",
    upsert: true,
  });

  return { ...state, enhanced: DRAFT_ENH };
}

export function workshopReply(
  message: string,
  refCount: number,
): { reply: string; adjust?: EnhanceOptions; wantsApprove?: boolean } {
  const m = message.toLowerCase().trim();

  if (/^(approve|approved|go live|looks good|perfect|done|ship it)/.test(m)) {
    return {
      reply:
        "Great — hit Approve & go live when you're ready. I'll register the visual and activate scanning.",
      wantsApprove: true,
    };
  }

  if (refCount === 0) {
    return {
      reply: "Upload at least one image first — use the upload area above or drag files in.",
    };
  }

  const adjust: EnhanceOptions = {};

  if (/bright|lighter|lighten/.test(m)) adjust.brightness = 1.12;
  if (/dark|darker|dim/.test(m)) adjust.brightness = 0.88;
  if (/sharp|crisp|detail/.test(m)) adjust.sharpness = 1.8;
  if (/soft|smooth|blur/.test(m)) adjust.sharpness = 0.7;
  if (/contrast|punch|pop/.test(m)) adjust.contrast = 1.15;
  if (/high.?res|upscale|bigger|larger|hq|quality/.test(m)) adjust.maxEdge = 2560;

  if (Object.keys(adjust).length > 0) {
    const parts = [];
    if (adjust.brightness) parts.push(adjust.brightness > 1 ? "brighter" : "darker");
    if (adjust.sharpness)
      parts.push(adjust.sharpness > 1.2 ? "sharper" : "softer");
    if (adjust.contrast) parts.push("more contrast");
    if (adjust.maxEdge) parts.push("higher resolution");
    return {
      reply: `Updating the enhanced preview (${parts.join(", ")})…`,
      adjust,
    };
  }

  if (/reference|original|source/.test(m)) {
    return {
      reply: `I'm using your first upload as the primary visual (${refCount} reference${refCount === 1 ? "" : "s"} on file). Ask for brighter, sharper, or more contrast, or approve when it looks right.`,
    };
  }

  return {
    reply:
      "I can adjust the enhanced preview — try: \"make it brighter\", \"sharper\", \"more contrast\", or \"higher quality\". When you're happy, say \"approve\" or use the Approve button.",
  };
}

export function draftPublicUrl(portalId: string, file: string): string {
  return `/api/portals/${portalId}/image/draft?file=${encodeURIComponent(file)}`;
}
