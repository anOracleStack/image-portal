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
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#222",
          overflow: "hidden",
          marginTop: 4,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `hsl(${hue}, 70%, 50%)`,
            borderRadius: 999,
            transition: "width 0.3s",
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#0f0f0f",
        border: "1px solid #222",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#888",
          }}
        >
          Plan Usage
        </h3>
        <span
          style={{
            fontSize: "0.8125rem",
            color: "#aaa",
            textTransform: "capitalize",
          }}
        >
          {sub.plan_tier} plan
        </span>
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ color: "#aaa" }}>Scans this month</span>
            <span style={{ color: "#ededed", fontWeight: 600 }}>
              {scanUsed.toLocaleString()} / {limits.maxScansPerMonth.toLocaleString()}
            </span>
          </div>
          {bar(scanUsed, limits.maxScansPerMonth)}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ color: "#aaa" }}>Portals created</span>
            <span style={{ color: "#ededed", fontWeight: 600 }}>
              {portalUsed.toLocaleString()} / {limits.maxPortals.toLocaleString()}
            </span>
          </div>
          {bar(portalUsed, limits.maxPortals)}
        </div>
      </div>
    </div>
  );
}
