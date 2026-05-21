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

const statusClass: Record<string, string> = {
  active: "ip-badge-success",
  inactive: "ip-badge-muted",
  suspended: "ip-badge-danger",
};

export default function PortalCard({ portal, onDelete }: Props) {
  const domain = (() => {
    try {
      return new URL(portal.destination_url).hostname;
    } catch {
      return portal.destination_url;
    }
  })();

  const status = statusClass[portal.status] ?? "ip-badge-muted";

  return (
    <div className="ip-card" style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0, flex: 1 }}>
          <div className="ip-portal-thumb" aria-hidden>
            ◫
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 className="ip-display" style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>
              {portal.title}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: "0.82rem" }}>
              <span className="ip-mono" style={{ color: "var(--accent)" }}>
                /p/{portal.slug}
              </span>
              <span className={`ip-badge ${status}`}>{portal.status}</span>
              <span className="ip-muted">{domain}</span>
              <span className="ip-muted">
                {portal.visibility === "public" ? "Public" : "Private"}
              </span>
              <span className="ip-muted">{portal.total_scans} scans</span>
              <span className="ip-faint">{timeAgo(portal.last_scanned_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={(e) => e.preventDefault()}>
          <a href={`/dashboard/${portal.id}/edit`} className="ip-btn ip-btn-ghost ip-btn-sm">
            Edit
          </a>
          <button type="button" className="ip-btn ip-btn-danger ip-btn-sm" onClick={() => onDelete(portal.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
