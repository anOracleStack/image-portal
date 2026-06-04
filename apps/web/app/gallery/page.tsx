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

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "business-cards", label: "Business cards" },
  { id: "logos", label: "Logos" },
  { id: "menus", label: "Menus" },
  { id: "posters", label: "Posters" },
  { id: "other", label: "Other" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function inferCategory(title: string, slug: string): CategoryId {
  const hay = `${title} ${slug}`.toLowerCase();
  if (/(card|business|contact|vcard)/.test(hay)) return "business-cards";
  if (/(logo|brand|mark)/.test(hay)) return "logos";
  if (/(menu|food|restaurant|cafe|bar)/.test(hay)) return "menus";
  if (/(poster|flyer|print|billboard|ad)/.test(hay)) return "posters";
  return "other";
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
  const [category, setCategory] = useState<CategoryId>("all");

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return portals.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);
      const matchesCategory =
        category === "all" || inferCategory(p.title, p.slug) === category;
      return matchesSearch && matchesCategory;
    });
  }, [portals, search, category]);

  return (
    <MarketingPage>
      <section className="ip-section ip-section-center">
        <PageIntro
          title="Public gallery"
          lines={[
            "Free portals appear here automatically.",
            "Paid plans can stay public or hide from the gallery.",
          ]}
        />
        <p className="ip-muted ip-gallery-explainer">
          Only portals marked <strong>public</strong> are listed. Private portals stay off this page.
        </p>
      </section>

      <section className="ip-section ip-gallery-search-wrap ip-panel">
        <div className="ip-gallery-filters" role="group" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ip-gallery-chip${category === c.id ? " ip-gallery-chip-active" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          className="ip-input ip-gallery-search-input"
          type="text"
          placeholder="Search by title or slug…"
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
            search || category !== "all"
              ? ["No portals match", "your filters."]
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
