"use client";

import { useEffect, useState, useCallback } from "react";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

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
    <div className="ip-dash-page-wide">
      <PageIntro
        title="Scan History"
        lines={[
          "Every match attempt",
          "across your portals.",
        ]}
      />

      <div className="ip-card ip-table-scroll">
        {events.length === 0 && !loading && (
          <div className="ip-empty-state">
            <BalancedText className="ip-muted ip-text-block" lines={["No scan events yet."]} />
          </div>
        )}

        {events.length === 0 && loading && (
          <div className="ip-empty-state">
            <BalancedText className="ip-muted ip-text-block" lines={["Loading…"]} />
          </div>
        )}

        {events.length > 0 && (
          <div>
            <table className="ip-data-table">
              <thead>
                <tr>
                  <th>Portal</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Device</th>
                  <th>Source</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.portals?.title ?? "—"}</td>
                    <td>
                      <span
                        className={`ip-match-pill ${e.matched ? "ip-match-pill-yes" : "ip-match-pill-no"}`}
                      >
                        {e.matched ? "Matched" : "No Match"}
                      </span>
                    </td>
                    <td>
                      {e.confidence != null
                        ? `${(e.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td>{e.device_platform ?? "—"}</td>
                    <td>{e.source ?? "—"}</td>
                    <td>{timeAgo(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div className="ip-load-more">
                <button
                  type="button"
                  className="ip-btn ip-btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading…" : `Load More (${events.length} of ${total})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
