import { createAdminClient } from "@/lib/supabase-admin";
import {
  STORAGE_BUCKETS,
  type StorageBucketId,
} from "@/lib/storage-buckets";

type BucketConfig = {
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[] | null;
};

const BUCKET_CONFIG: Record<StorageBucketId, BucketConfig> = {
  [STORAGE_BUCKETS.PORTAL_IMAGES]: {
    public: false,
    fileSizeLimit: 10_485_760,
    allowedMimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/json",
    ],
  },
  [STORAGE_BUCKETS.PORTAL_CACHE]: {
    public: false,
    fileSizeLimit: 10_485_760,
    allowedMimeTypes: null,
  },
  [STORAGE_BUCKETS.PORTAL_EXPORTS]: {
    public: false,
    fileSizeLimit: 52_428_800,
    allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
  },
  [STORAGE_BUCKETS.AVATARS]: {
    public: true,
    fileSizeLimit: 2_097_152,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  },
};

/**
 * Creates missing Supabase Storage buckets via the service-role API.
 * SQL migrations alone may not run on production; this is the runtime fallback.
 */
export async function ensureStorageBuckets(
  ...buckets: StorageBucketId[]
): Promise<void> {
  const db = createAdminClient();
  const { data: existing, error: listError } = await db.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const id of buckets) {
    if (existingIds.has(id)) continue;

    const config = BUCKET_CONFIG[id];
    const { error } = await db.storage.createBucket(id, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes ?? undefined,
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(
        `Failed to create storage bucket "${id}": ${error.message}`,
      );
    }
  }
}
