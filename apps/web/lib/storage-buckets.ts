/** Supabase Storage bucket IDs — must match supabase/migrations storage policies. */
export const STORAGE_BUCKETS = {
  PORTAL_IMAGES: "portal-images",
  PORTAL_CACHE: "portal-cache",
  PORTAL_EXPORTS: "portal-exports",
  AVATARS: "avatars",
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export function storageBucketErrorMessage(
  bucket: StorageBucketId,
  raw: string,
): string {
  if (/bucket not found/i.test(raw)) {
    return `Storage bucket "${bucket}" is missing. Run Supabase migrations or create the bucket in the Supabase dashboard (Storage → New bucket → id: ${bucket}).`;
  }
  return raw;
}
