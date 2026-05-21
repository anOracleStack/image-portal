"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalCard from "@/components/PortalCard";
import { BalancedText } from "@/components/ui/BalancedText";
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
      if (
        !confirm(
          "Delete this portal?\n\nThis permanently removes images & fingerprints.\nThis cannot be undone."
        )
      )
        return;
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
          className="ip-input"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search portals by title or slug…"
          style={{ marginBottom: "1rem" }}
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
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ marginTop: "2rem" }}
          lines={["No portals match", `“${search}”`]}
        />
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="ip-btn ip-btn-secondary"
            onClick={() => setPage((p) => p + 1)}
          >
            Load more ({filtered.length - visible.length} remaining)
          </button>
        </div>
      )}
    </>
  );
}
