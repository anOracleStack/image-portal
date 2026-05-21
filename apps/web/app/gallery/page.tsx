"use client";

import { useEffect, useState, useMemo } from "react";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { BalancedText } from "@/components/ui/BalancedText";

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

export default function GalleryPage() {
  const [portals, setPortals] = useState<GalleryPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/portals/public")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPortals(data.portals ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => portals.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [portals, search]
  );

  return (
    <MarketingPage>
      <section className="ip-section" style={{ textAlign: "center", paddingTop: "2.5rem" }}>
        <h1 className="ip-display" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", margin: "0 0 0.5rem" }}>
          Portal Gallery
        </h1>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ margin: 0, maxWidth: 280 }}
          lines={["Browse public image portals"]}
        />
      </section>

      <section className="ip-section" style={{ paddingTop: 0, maxWidth: 480, margin: "0 auto" }}>
        <input
          className="ip-input"
          type="text"
          placeholder="Search portals by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {error && (
        <section className="ip-section" style={{ paddingTop: 0 }}>
          <div className="ip-card" style={{ color: "var(--danger)", maxWidth: 480, margin: "0 auto" }}>
            {error}
          </div>
        </section>
      )}

      {loading && (
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ padding: "3rem 1rem" }}
          lines={["Loading portals…"]}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ padding: "3rem 1rem" }}
          lines={
            search
              ? ["No portals match", "your search."]
              : ["No public portals yet."]
          }
        />
      )}

      {!loading && filtered.length > 0 && (
        <section
          className="ip-section"
          style={{
            paddingTop: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
            maxWidth: 960,
          }}
        >
          {filtered.map((p) => {
            let domain = p.destination_url;
            try {
              domain = new URL(p.destination_url).hostname;
            } catch {
              /* keep raw */
            }
            return (
              <a
                key={p.id}
                href={`/p/${p.slug}`}
                className="ip-card ip-card-interactive"
                style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 8 }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{p.title}</h3>
                <span className="ip-mono" style={{ fontSize: "0.82rem", color: "var(--accent)" }}>
                  /p/{p.slug}
                </span>
                <span className="ip-muted" style={{ fontSize: "0.82rem" }}>{domain}</span>
                <span className="ip-faint" style={{ fontSize: "0.82rem" }}>
                  {p.total_scans} scan{p.total_scans !== 1 ? "s" : ""} · {timeAgo(p.last_scanned_at)}
                </span>
              </a>
            );
          })}
        </section>
      )}
    </MarketingPage>
  );
}
