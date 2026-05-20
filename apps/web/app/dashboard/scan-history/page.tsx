"use client";

import { useEffect, useState, useCallback } from "react";

interface ScanEvent {
  id: string;
  portal_id: string;
  matched: boolean;
  confidence: number | null;
  device_platform: string | null;
  source: string | null;
  source_type: string | null;
  created_at: string;
  portals: {
    title: string;
  };
}

function timeAgo(dateStr: string): string {
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

const s = {
  page: { color: "#ededed" },
  heading: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 1.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.85rem",
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 8px",
    color: "#888",
    borderBottom: "1px solid #222",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #1a1a1a",
    color: "#ccc",
  },
  matchBadge: (matched: boolean) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: matched ? "#22c55e22" : "#ef444422",
    color: matched ? "#22c55e" : "#ef4444",
  }),
  section: {
    background: "#141414",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "1.5rem",
    overflowX: "auto" as const,
  },
  empty: {
    textAlign: "center" as const,
    padding: "3rem 1rem",
    color: "#666",
  },
  loading: {
    textAlign: "center" as const,
    padding: "3rem 1rem",
    color: "#666",
  },
  loadMoreWrap: {
    textAlign: "center" as const,
    marginTop: "1rem",
  },
  loadMoreBtn: {
    background: "#222",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#ededed",
    cursor: "pointer",
  },
};

const PAGE_SIZE = 20;

export default function ScanHistoryPage() {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchEvents = useCallback(async (off: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portals/scan-history?limit=${PAGE_SIZE}&offset=${off}`
      );
      const data = await res.json();
      if (data.events) {
        setEvents((prev) => (append ? [...prev, ...data.events] : data.events));
        setTotal(data.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0, false);
  }, [fetchEvents]);

  const loadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchEvents(newOffset, true);
  };

  const hasMore = events.length < total;

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Scan History</h1>

      <div style={s.section}>
        {events.length === 0 && !loading && (
          <div style={s.empty}>No scan events yet</div>
        )}

        {events.length === 0 && loading && (
          <div style={s.loading}>Loading...</div>
        )}

        {events.length > 0 && (
          <div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Portal</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Confidence</th>
                  <th style={s.th}>Device</th>
                  <th style={s.th}>Source</th>
                  <th style={s.th}>When</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td style={s.td}>{e.portals?.title ?? "—"}</td>
                    <td style={s.td}>
                      <span style={s.matchBadge(e.matched)}>
                        {e.matched ? "Matched" : "No Match"}
                      </span>
                    </td>
                    <td style={s.td}>
                      {e.confidence != null
                        ? `${(e.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td style={s.td}>{e.device_platform ?? "—"}</td>
                    <td style={s.td}>{e.source ?? "—"}</td>
                    <td style={s.td}>{timeAgo(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div style={s.loadMoreWrap}>
                <button
                  style={s.loadMoreBtn}
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : `Load More (${events.length} of ${total})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
