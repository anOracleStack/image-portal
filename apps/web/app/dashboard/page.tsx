import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import PortalList from "./PortalList";
import { UsageSummary } from "@/components/UsageSummary";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { OnboardingStrip } from "@/components/OnboardingStrip";
import { BalancedText } from "@/components/ui/BalancedText";

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
    scan_mode: "image";
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
    <div className="ip-dash-shell">
      {ownerId && <UsageSummary userId={ownerId} />}
      {portals.length === 0 && <OnboardingStrip />}
      <AnalyticsDashboard />
      <section className="ip-dash-section">
        <div className="ip-dash-section-head">
          <h1 className="ip-dash-section-title">Your portals</h1>
          <a href="/dashboard/create" className="ip-btn ip-btn-primary ip-btn-sm">
            + Create portal
          </a>
        </div>

      {fetchError && (
        <div className="ip-card ip-card-danger">{fetchError}</div>
      )}

      {portals.length === 0 && !fetchError ? (
        <div className="ip-card ip-card-glow ip-card-copy ip-dash-empty">
          <div className="ip-portal-thumb ip-dash-empty-icon">◫</div>
          <p className="ip-dash-section-title-sm ip-mb-sm">
            Create your first portal
          </p>
          <BalancedText
            className="ip-muted ip-text-block ip-dash-lead"
            lines={[
              "Upload an image, set a destination,",
              "& share a scannable link anywhere.",
            ]}
          />
          <a href="/dashboard/create" className="ip-btn ip-btn-primary">
            Create portal
          </a>
        </div>
      ) : (
        <PortalList initial={portals} />
      )}
      </section>
    </div>
  );
}
