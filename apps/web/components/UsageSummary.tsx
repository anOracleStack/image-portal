import { createAdminClient } from "@/lib/supabase-admin";
import { getUserSubscription, getPlanLimits } from "@/lib/subscription";

interface Props {
  userId: string;
}

export async function UsageSummary({ userId }: Props) {
  const admin = createAdminClient();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [sub, usage] = await Promise.all([
    getUserSubscription(userId),
    admin
      .from("subscription_usage")
      .select("scan_count, portal_count")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
  ]);

  const limits = getPlanLimits(sub.plan_tier);
  const usageData = usage?.data ?? null;
  const scanUsed = (usageData as { scan_count?: number } | null)?.scan_count ?? 0;
  const portalUsed = (usageData as { portal_count?: number } | null)?.portal_count ?? 0;

  const bar = (used: number, max: number) => {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const hue = pct < 60 ? 140 : pct < 85 ? 40 : 0;
    return (
      <div className="ip-usage-bar-track">
        <div
          className="ip-usage-bar-fill"
          style={{
            width: `${pct}%`,
            background: `hsl(${hue}, 70%, 50%)`,
          }}
        />
      </div>
    );
  };

  return (
    <section className="ip-dash-section ip-card ip-card-copy ip-usage-summary">
      <div className="ip-usage-summary-head">
        <h2 className="ip-dash-section-title-sm">Plan usage</h2>
        <span className="ip-usage-plan-label">{sub.plan_tier} plan</span>
      </div>

      <div className="ip-usage-metrics">
        <div className="ip-usage-metric">
          <div className="ip-usage-metric-row">
            <span className="ip-muted">Scans this month</span>
            <span className="ip-usage-metric-value">
              {scanUsed.toLocaleString()} / {limits.maxScansPerMonth.toLocaleString()}
            </span>
          </div>
          {bar(scanUsed, limits.maxScansPerMonth)}
        </div>

        <div className="ip-usage-metric">
          <div className="ip-usage-metric-row">
            <span className="ip-muted">Portals created</span>
            <span className="ip-usage-metric-value">
              {portalUsed.toLocaleString()} / {limits.maxPortals.toLocaleString()}
            </span>
          </div>
          {bar(portalUsed, limits.maxPortals)}
        </div>
      </div>
    </section>
  );
}
