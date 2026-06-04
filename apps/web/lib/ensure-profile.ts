import "server-only";
import { createAdminClient } from "@/lib/supabase-admin";

export class ProfileEnsureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileEnsureError";
  }
}

/** Ensure a profiles row exists (portals FK requires profiles.id). */
export async function ensureProfile(
  userId: string,
  opts?: { displayName?: string | null }
) {
  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw new ProfileEnsureError(`Profile lookup failed: ${selectError.message}`);
  }

  const displayName = opts?.displayName?.trim();

  if (existing) {
    if (displayName) {
      const { error: updateError } = await admin
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId);
      if (updateError) {
        throw new ProfileEnsureError(
          `Profile update failed: ${updateError.message}`
        );
      }
    }
    return;
  }

  const row: { id: string; display_name?: string } = { id: userId };
  if (displayName) {
    row.display_name = displayName;
  }

  const { error: insertError } = await admin.from("profiles").insert(row);
  if (insertError) {
    if (insertError.code === "23505") {
      return;
    }
    throw new ProfileEnsureError(
      `Profile creation failed: ${insertError.message}`
    );
  }

  const { data: verified, error: verifyError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (verifyError || !verified) {
    throw new ProfileEnsureError(
      verifyError?.message ??
        "Profile row missing after insert. Verify SUPABASE_SERVICE_ROLE_KEY is the service role key for this Supabase project."
    );
  }
}
