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
    return `Image storage isn’t ready yet (bucket id: ${bucket}). Ask your admin to run Supabase migrations, or create a bucket named exactly “${bucket}” in the Supabase dashboard under Storage → New bucket.`;
  }
  return raw;
}
