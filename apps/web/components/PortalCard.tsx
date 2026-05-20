"use client";

import { PortalRow } from "@/lib/types";

interface Props {
  portal: PortalRow;
  onDelete: (id: string) => void;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const statusColor: Record<string, string> = {
  active: "#22c55e",
  inactive: "#6b7280",
  suspended: "#ef4444",
};

const styles = {
  card: {
    background: "#141414",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  left: { display: "flex", flexDirection: "column" as const, gap: 6, minWidth: 0 },
  title: { fontSize: "1.1rem", fontWeight: 600, color: "#ededed", margin: 0 },
  meta: {
    fontSize: "0.82rem",
    color: "#888",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  badge: (color: string) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: color + "22",
    color,
  }),
  actions: { display: "flex", gap: 8, flexShrink: 0 },
  btn: (bg: string) => ({
    background: bg,
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: "0.82rem",
    color: "#ededed",
    cursor: "pointer",
  }),
};

export default function PortalCard({ portal, onDelete }: Props) {
  const domain = (() => {
    try {
      return new URL(portal.destination_url).hostname;
    } catch {
      return portal.destination_url;
    }
  })();

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div style={styles.left}>
          <h3 style={styles.title}>{portal.title}</h3>
          <div style={styles.meta}>
            <span style={{ color: "#7df" }}>/p/{portal.slug}</span>
            <span style={styles.badge(statusColor[portal.status] ?? "#888")}>
              {portal.status}
            </span>
            <span>{domain}</span>
            <span>
              {portal.visibility === "public"
                ? "🌍"
                : "🔒"}{" "}
              {portal.visibility}
            </span>
            <span>{portal.total_scans} scans</span>
            <span>{timeAgo(portal.last_scanned_at)}</span>
          </div>
        </div>
        <div style={styles.actions}>
          <a
            href={`/dashboard/${portal.id}/edit`}
            style={styles.btn("#333")}
          >
            Edit
          </a>
          <button
            style={styles.btn("#3b1a1a")}
            onClick={() => onDelete(portal.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
