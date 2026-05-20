import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import PortalDetailClient from "./PortalDetailClient";
import type { PortalRow, PortalImageRow } from "@/lib/types";

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 1rem",
          color: "#ef4444",
        }}
      >
        Unauthorized. Please sign in.
      </div>
    );
  }

  let portal: PortalRow | null = null;
  let images: PortalImageRow[] = [];
  let fetchError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data: portalData, error: portalErr } = await admin
      .from("portals")
      .select("*")
      .eq("id", id)
      .single();

    if (portalErr) {
      if (portalErr.code === "PGRST116") notFound();
      fetchError = portalErr.message;
    } else {
      portal = portalData as PortalRow;

      // Verify ownership
      if (portal.owner_id !== user.id) {
        return (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1rem",
              color: "#ef4444",
            }}
          >
            You do not have access to this portal.
          </div>
        );
      }

      // Fetch images
      const { data: imageData } = await admin
        .from("portal_images")
        .select("*")
        .eq("portal_id", id)
        .order("created_at", { ascending: false });

      images = (imageData ?? []) as PortalImageRow[];
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load portal";
  }

  if (fetchError) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 1rem",
          color: "#ef4444",
        }}
      >
        {fetchError}
      </div>
    );
  }

  if (!portal) notFound();

  return <PortalDetailClient portal={portal} images={images} userId={user.id} />;
}
