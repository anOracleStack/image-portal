"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalCard from "@/components/PortalCard";
import type { PortalRow } from "@/lib/types";

interface Props {
  initial: PortalRow[];
}

const ITEMS_PER_PAGE = 20;

export default function PortalList({ initial }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [portals, setPortals] = useState(initial);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return portals;
    const q = search.toLowerCase();
    return portals.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [search, portals]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visible = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = visible.length < filtered.length;

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this portal? This cannot be undone.")) return;
      try {
        const res = await fetch(`/api/portals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setPortals((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      } catch {
        alert("Failed to delete portal.");
      }
    },
    [router]
  );

  return (
    <>
      {/* Search */}
      {portals.length > 0 && (
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search portals by title or slug…"
          style={{
            width: "100%",
            background: "#141414",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "0.9rem",
            color: "#ededed",
            outline: "none",
            marginBottom: "1rem",
            boxSizing: "border-box",
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((portal) => (
          <a
            key={portal.id}
            href={`/dashboard/${portal.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <PortalCard portal={portal} onDelete={handleDelete} />
          </a>
        ))}
      </div>

      {filtered.length === 0 && search && (
        <p style={{ color: "#888", textAlign: "center", marginTop: "2rem" }}>
          No portals match &ldquo;{search}&rdquo;
        </p>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "10px 24px",
              color: "#ccc",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Load More ({filtered.length - visible.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
