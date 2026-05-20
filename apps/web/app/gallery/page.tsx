"use client";

import { useEffect, useState, useMemo } from "react";
import { PortalRow } from "@/lib/types";

interface GalleryPortal {
  id: string;
  title: string;
  slug: string;
  destination_url: string;
  total_scans: number;
  last_scanned_at: string | null;
  created_at: string;
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

const s = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#ededed",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    textAlign: "center" as const,
    padding: "3rem 1rem 2rem",
  },
  title: { fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem" },
  subtitle: { fontSize: "0.95rem", color: "#888", margin: 0 },
  searchWrap: {
    maxWidth: 480,
    margin: "0 auto 2rem",
    padding: "0 1rem",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#141414",
    color: "#ededed",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 1rem 3rem",
  },
  card: {
    background: "#141414",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    transition: "border-color 0.15s",
  },
  cardTitle: { fontSize: "1.1rem", fontWeight: 600, color: "#ededed", margin: 0 },
  cardSlug: { fontSize: "0.82rem", color: "#7df" },
  cardDomain: { fontSize: "0.82rem", color: "#888" },
  cardScans: { fontSize: "0.82rem", color: "#666" },
  empty: {
    textAlign: "center" as const,
    padding: "4rem 1rem",
    color: "#888",
  },
  loading: {
    textAlign: "center" as const,
    padding: "4rem 1rem",
    color: "#666",
  },
  error: {
    background: "#2a0a0a",
    border: "1px solid #ef4444",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#ef4444",
    maxWidth: 480,
    margin: "0 auto 1rem",
  },
  topLink: {
    display: "inline-block",
    color: "#888",
    textDecoration: "none",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
};

export default function GalleryPage() {
  const [portals, setPortals] = useState<GalleryPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/portals/public")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPortals(data.portals ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      portals.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      ),
    [portals, search]
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <a href="/" style={s.topLink}>&larr; Back to Home</a>
        <h1 style={s.title}>Portal Gallery</h1>
        <p style={s.subtitle}>Browse public image portals</p>
      </div>

      <div style={s.searchWrap}>
        <input
          style={s.input}
          type="text"
          placeholder="Search portals by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div style={s.error}>{error}</div>}

      {loading && <div style={s.loading}>Loading portals...</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={s.empty}>
          <p style={{ fontSize: "1.1rem", marginBottom: 8 }}>
            {search ? "No portals match your search" : "No public portals yet"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={s.grid}>
          {filtered.map((p) => {
            const domain = (() => {
              try {
                return new URL(p.destination_url).hostname;
              } catch {
                return p.destination_url;
              }
            })();

            return (
              <a key={p.id} href={`/p/${p.slug}`} style={s.card}>
                <h3 style={s.cardTitle}>{p.title}</h3>
                <span style={s.cardSlug}>/p/{p.slug}</span>
                <span style={s.cardDomain}>{domain}</span>
                <span style={s.cardScans}>
                  {p.total_scans} scan{p.total_scans !== 1 ? "s" : ""} &middot;{" "}
                  {timeAgo(p.last_scanned_at)}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
