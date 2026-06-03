import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import PortalDetailClient from "./PortalDetailClient";
import { BalancedText } from "@/components/ui/BalancedText";
import type { PortalRow, PortalImageRow } from "@/lib/types";

function ErrorPanel({ lines }: { lines: readonly string[] }) {
  return (
    <div className="ip-card ip-card-danger ip-error-panel-centered">
      <BalancedText className="ip-text-block" lines={lines} />
    </div>
  );
}

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
    return <ErrorPanel lines={["Unauthorized.", "Please sign in."]} />;
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
        return <ErrorPanel lines={["You do not have access", "to this portal."]} />;
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
    return <ErrorPanel lines={[fetchError]} />;
  }

  if (!portal) notFound();

  return <PortalDetailClient portal={portal} images={images} userId={user.id} />;
}
