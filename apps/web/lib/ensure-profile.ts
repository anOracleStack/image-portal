import "server-only";
import { createAdminClient } from "@/lib/supabase-admin";

/** Ensure a profiles row exists (portals FK requires profiles.id). */
export async function ensureProfile(
  userId: string,
  opts?: { displayName?: string | null }
) {
  const admin = createAdminClient();
  const row: { id: string; display_name?: string } = { id: userId };
  if (opts?.displayName?.trim()) {
    row.display_name = opts.displayName.trim();
  }

  const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }
}
