"use client";

import { useEffect, useState, useMemo } from "react";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
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
      <section className="ip-section ip-section-center">
        <PageIntro
          title="Portal Gallery"
          lines={["Browse public image portals", "from the community."]}
        />
      </section>

      <section className="ip-section ip-gallery-search-wrap">
        <input
          className="ip-input"
          type="text"
          placeholder="Search portals by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {error && (
        <section className="ip-section ip-gallery-search-wrap">
          <div className="ip-card ip-card-danger">{error}</div>
        </section>
      )}

      {loading && (
        <BalancedText
          className="ip-muted ip-text-block ip-gallery-state"
          lines={["Loading portals…"]}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <BalancedText
          className="ip-muted ip-text-block ip-gallery-state"
          lines={
            search
              ? ["No portals match", "your search."]
              : ["No public portals yet."]
          }
        />
      )}

      {!loading && filtered.length > 0 && (
        <section className="ip-section ip-gallery-grid">
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
                className="ip-card ip-card-interactive ip-gallery-card"
              >
                <h3 className="ip-gallery-card-title">{p.title}</h3>
                <span className="ip-mono ip-gallery-card-slug">/p/{p.slug}</span>
                <span className="ip-muted ip-gallery-card-meta">{domain}</span>
                <span className="ip-faint ip-gallery-card-meta">
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
