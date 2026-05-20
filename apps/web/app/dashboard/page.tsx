import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import PortalList from "./PortalList";
import { UsageSummary } from "@/components/UsageSummary";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { OnboardingStrip } from "@/components/OnboardingStrip";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = user?.id ?? "";

  // Fetch portals server-side for fast initial render
  let portals: Array<{
    id: string;
    owner_id: string;
    title: string;
    slug: string;
    destination_url: string;
    status: "active" | "inactive" | "suspended";
    scan_mode: "image" | "hybrid";
    visibility: "public" | "private";
    total_scans: number;
    last_scanned_at: string | null;
    created_at: string;
    updated_at: string;
  }> = [];
  let fetchError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("portals")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      fetchError = error.message;
    } else {
      portals = data ?? [];
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load portals";
  }

  return (
    <div>
      {ownerId && <UsageSummary userId={ownerId} />}
      {portals.length === 0 && <OnboardingStrip />}
      <AnalyticsDashboard />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Your Portals
        </h1>
        <a
          href="/dashboard/create"
          style={{
            background: "#7df",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#0a0a0a",
            textDecoration: "none",
          }}
        >
          + Create Portal
        </a>
      </div>

      {fetchError && (
        <div
          style={{
            background: "#2a0a0a",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#ef4444",
            marginBottom: "1rem",
          }}
        >
          {fetchError}
        </div>
      )}

      {portals.length === 0 && !fetchError ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            color: "#888",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginBottom: 8 }}>
            Create your first portal to get started
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            Portals let you monitor images submitted to your endpoint.
          </p>
        </div>
      ) : (
        <PortalList initial={portals} />
      )}
    </div>
  );
}
