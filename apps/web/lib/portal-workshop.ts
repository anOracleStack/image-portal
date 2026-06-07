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

export { workshopReplyFallback as workshopReply } from "@/lib/assistant-fallback";

export function draftPublicUrl(portalId: string, file: string): string {
  return `/api/portals/${portalId}/image/draft?file=${encodeURIComponent(file)}`;
}
