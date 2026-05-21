"use client";

import { useEffect, useState } from "react";
import { BalancedText } from "@/components/ui/BalancedText";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DailyScan {
  date: string;
  count: number;
}

type PlatformEntry = { [key: string]: string | number; platform: string; count: number };
type SourceEntry = { [key: string]: string | number; source: string; count: number };

interface TopPortal {
  portal_id: string;
  title: string;
  count: number;
}

interface AnalyticsData {
  dailyScans: DailyScan[];
  matchRate: { matched: number; unmatched: number };
  devicePlatforms: PlatformEntry[];
  sources: SourceEntry[];
  topPortals: TopPortal[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portals/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json() as Promise<AnalyticsData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ padding: "2rem 1rem" }}
          lines={["Loading analytics…"]}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="ip-card"
        style={{
          marginBottom: "1.5rem",
          color: "var(--danger)",
          borderColor: "var(--danger)",
        }}
      >
        <BalancedText className="ip-text-block" style={{ padding: "1rem" }} lines={[error]} />
      </div>
    );
  }

  // Empty state
  const hasData =
    data && data.dailyScans.some((d) => d.count > 0);
  if (!hasData) {
    return (
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="ip-section-title">Scan analytics</h3>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ padding: "1.5rem 1rem 2rem" }}
          lines={[
            "No scan data yet.",
            "Scans appear here once people",
            "interact with your portals.",
          ]}
        />
      </div>
    );
  }

  const totalScans = data!.matchRate.matched + data!.matchRate.unmatched;

  return (
    <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
      <h3 className="ip-section-title">Scan analytics</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1rem",
        }}
      >
        {/* ── Daily scans bar chart ── */}
        <div style={subsectionStyle}>
          <h4 style={subsectionTitleStyle}>Daily Scans (Last 30 Days)</h4>
          <BarChart data={data!.dailyScans} />
        </div>

        {/* ── Match rate donut ── */}
        <div style={subsectionStyle}>
          <h4 style={subsectionTitleStyle}>Match Rate</h4>
          <DonutChart
            matched={data!.matchRate.matched}
            unmatched={data!.matchRate.unmatched}
            total={totalScans}
          />
        </div>

        {/* ── Device platform ── */}
        <div style={subsectionStyle}>
          <h4 style={subsectionTitleStyle}>Device Platform</h4>
          <BreakdownList
            entries={data!.devicePlatforms}
            total={totalScans}
            labelKey="platform"
          />
        </div>

        {/* ── Source ── */}
        <div style={subsectionStyle}>
          <h4 style={subsectionTitleStyle}>Source</h4>
          <BreakdownList
            entries={data!.sources}
            total={totalScans}
            labelKey="source"
          />
        </div>
      </div>

      {/* ── Top portals ── */}
      {data!.topPortals.length > 0 && (
        <div style={{ ...subsectionStyle, marginTop: "1rem" }}>
          <h4 style={subsectionTitleStyle}>Top Scanned Portals</h4>
          <TopPortalsList portals={data!.topPortals} total={totalScans} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar chart
// ---------------------------------------------------------------------------
function BarChart({ data }: { data: DailyScan[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        height: 120,
        paddingTop: 8,
      }}
    >
      {data.map((d) => {
        const pct = (d.count / maxCount) * 100;
        const label = d.date.slice(5);
        return (
          <div
            key={d.date}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div
              title={`${label}: ${d.count} scans`}
              style={{
                width: "100%",
                maxWidth: 20,
                height: `${pct}%`,
                minHeight: d.count > 0 ? 4 : 0,
                background: "var(--accent)",
                borderRadius: "3px 3px 0 0",
                transition: "height 0.3s",
              }}
            />
            {data.length <= 15 && (
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-faint)",
                  marginTop: 4,
                }}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut chart
// ---------------------------------------------------------------------------
function DonutChart({
  matched,
  unmatched,
  total,
}: {
  matched: number;
  unmatched: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="ip-muted ip-text-block" style={{ textAlign: "center", padding: "1rem" }}>
        No data
      </div>
    );
  }

  const matchedPct = ((matched / total) * 100).toFixed(1);
  const unmatchedPct = ((unmatched / total) * 100).toFixed(1);
  const matchedDeg = (matched / total) * 360;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        padding: "0.5rem 0",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `conic-gradient(var(--accent) 0deg ${matchedDeg}deg, var(--border-strong) ${matchedDeg}deg 360deg)`,
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: "0.8125rem" }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent)",
              marginRight: 8,
            }}
          />
          <span className="ip-muted">Matched</span>
          <span style={{ marginLeft: 8, fontWeight: 600 }}
          >
            {matched.toLocaleString()} ({matchedPct}%)
          </span>
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--border-strong)",
              marginRight: 8,
            }}
          />
          <span className="ip-muted">Unmatched</span>
          <span style={{ marginLeft: 8, fontWeight: 600 }}
          >
            {unmatched.toLocaleString()} ({unmatchedPct}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic breakdown list (device platform / source)
// ---------------------------------------------------------------------------
function BreakdownList({
  entries,
  total,
  labelKey,
}: {
  entries: { count: number; [key: string]: string | number }[];
  total: number;
  labelKey: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="ip-muted ip-text-block" style={{ textAlign: "center", padding: "1rem" }}>
        No data
      </div>
    );
  }

  const colors = [
    "var(--accent)",
    "color-mix(in srgb, var(--accent) 85%, var(--text))",
    "color-mix(in srgb, var(--accent) 70%, var(--text))",
    "color-mix(in srgb, var(--accent) 55%, var(--text-muted))",
    "var(--text-muted)",
    "color-mix(in srgb, var(--accent) 40%, var(--border))",
    "var(--border-strong)",
    "var(--text-faint)",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0.5rem 0",
      }}
    >
      {entries.map((entry, i) => {
        const pct = total > 0 ? ((entry.count / total) * 100).toFixed(1) : "0";
        const label = (entry[labelKey] as string) || "unknown";
        return (
          <div key={label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8125rem",
                marginBottom: 4,
              }}
            >
              <span className="ip-muted" style={{ textTransform: "capitalize" }}>
                {label}
              </span>
              <span style={{ fontWeight: 600 }}>
                {entry.count.toLocaleString()} ({pct}%)
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: colors[i % colors.length],
                  borderRadius: 999,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top portals list
// ---------------------------------------------------------------------------
function TopPortalsList({
  portals,
  total,
}: {
  portals: TopPortal[];
  total: number;
}) {
  const maxCount = Math.max(...portals.map((p) => p.count), 1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0.5rem 0",
      }}
    >
      {portals.map((p, i) => {
        const pct = (p.count / maxCount) * 100;
        const share = total > 0 ? ((p.count / total) * 100).toFixed(1) : "0";
        return (
          <div key={p.portal_id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8125rem",
                marginBottom: 4,
              }}
            >
              <span className="ip-muted">
                <span className="ip-faint" style={{ marginRight: 6 }}>
                  #{i + 1}
                </span>
                {p.title}
              </span>
              <span style={{ fontWeight: 600 }}>
                {p.count.toLocaleString()} ({share}%)
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: "var(--accent)",
                  borderRadius: 999,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const subsectionStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "1rem",
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  margin: 0,
  color: "var(--text-muted)",
  marginBottom: 8,
};
