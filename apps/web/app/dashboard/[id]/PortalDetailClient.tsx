"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import type { PortalRow, PortalImageRow } from "@/lib/types";

interface Props {
  portal: PortalRow;
  images: PortalImageRow[];
  userId: string;
}

const statusColor: Record<string, string> = {
  active: "#22c55e",
  inactive: "#6b7280",
  suspended: "#ef4444",
};

/// --- style helpers ---
function badge(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: color + "22",
    color,
  };
}
function btn(bg: string, fg: string = "#ededed"): React.CSSProperties {
  return {
    background: bg,
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: "0.85rem",
    color: fg,
    cursor: "pointer",
    fontWeight: 600,
  };
}
const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" as const },
  title: { fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#ededed" },
  metaRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" as const },
  section: { background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: 600, color: "#ededed", marginTop: 0, marginBottom: "0.75rem" },
  label: { fontSize: "0.85rem", fontWeight: 500, color: "#888" },
  value: { fontSize: "0.95rem", color: "#ccc", marginBottom: "0.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 },
  thumb: { width: "100%", aspectRatio: "1", objectFit: "cover" as const, borderRadius: 6, background: "#1a1a1a" },
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  confirmBox: { background: "#141414", border: "1px solid #333", borderRadius: 12, padding: "1.5rem 2rem", maxWidth: 400, textAlign: "center" as const },
};

export default function PortalDetailClient({ portal, images, userId }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(portal.status);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const domain = (() => {
    try {
      return new URL(portal.destination_url).hostname;
    } catch {
      return portal.destination_url;
    }
  })();

  const handleUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ownerId", userId);

      const res = await fetch(`/api/portals/${portal.id}/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      router.refresh();
    },
    [portal.id, router]
  );

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/portals/${portal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Failed to delete portal.");
    }
  }, [portal.id, router]);

  const handleToggleStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/portals/${portal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status" }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      const data = await res.json();
      setStatus(data.portal.status);
      router.refresh();
    } catch {
      alert("Failed to toggle status.");
    }
  }, [portal.id, router]);

  const handleExport = useCallback(
    async (type: string) => {
      setExporting(type);
      setExportMsg(null);
      try {
        const res = await fetch(`/api/portals/${portal.id}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Export failed");
        setExportMsg(`Exported — download started`);
        // Trigger browser download
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `${portal.slug}-${type}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        setExportMsg(err instanceof Error ? err.message : "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [portal.id, portal.slug]
  );

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{portal.title}</h1>
          <div style={s.metaRow}>
            <span style={{ color: "#7df" }}>/p/{portal.slug}</span>
            <span style={badge(statusColor[status] ?? "#888")}>
              {status}
            </span>
            <span style={{ color: "#888", fontSize: "0.85rem" }}>
              {portal.visibility === "public" ? "🌍 Public" : "🔒 Private"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={`/dashboard/${portal.id}/edit`}
            style={btn("#333", "#ededed")}
          >
            Edit
          </a>
          <button
            onClick={handleToggleStatus}
            style={btn(status === "active" ? "#5b3a0a" : "#1a3b1a")}
          >
            {status === "active" ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            style={btn("#3b1a1a", "#ef4444")}
          >
            Delete
          </button>
          <span style={{ color: "#444", fontSize: "0.75rem" }}>|</span>
          <button
            onClick={() => handleExport("qrcode")}
            disabled={exporting === "qrcode"}
            style={btn(exporting === "qrcode" ? "#2a3a2a" : "#1a2a1a", "#4ade80")}
          >
            {exporting === "qrcode" ? "..." : "QR Code"}
          </button>
          <button
            onClick={() => handleExport("image_only")}
            disabled={exporting === "image_only" || images.length === 0}
            style={btn(exporting === "image_only" ? "#2a2a3a" : "#1a1a2a", images.length === 0 ? "#555" : "#818cf8")}
          >
            {exporting === "image_only" ? "..." : "Export Image"}
          </button>
          <button
            onClick={() => handleExport("image_qr")}
            disabled={exporting === "image_qr" || images.length === 0}
            style={btn(exporting === "image_qr" ? "#2a2a3a" : "#1a1a2a", images.length === 0 ? "#555" : "#818cf8")}
          >
            {exporting === "image_qr" ? "..." : "Image+QR"}
          </button>
          {exportMsg && (
            <span style={{ color: exportMsg.startsWith("Exported") ? "#4ade80" : "#ef4444", fontSize: "0.8rem", marginLeft: 8 }}>
              {exportMsg}
            </span>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Details</h2>
        <div style={s.label}>Destination URL</div>
        <div style={s.value}>
          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#7df" }}
          >
            {domain}
          </a>
        </div>
        <div style={s.label}>Scan Mode</div>
        <div style={s.value}>{portal.scan_mode}</div>
        <div style={s.label}>Total Scans</div>
        <div style={s.value}>{portal.total_scans}</div>
        <div style={s.label}>Last Scanned</div>
        <div style={s.value}>
          {portal.last_scanned_at
            ? new Date(portal.last_scanned_at).toLocaleString()
            : "Never"}
        </div>
        <div style={s.label}>Created</div>
        <div style={{ ...s.value, marginBottom: 0 }}>
          {new Date(portal.created_at).toLocaleString()}
        </div>
      </div>

      {/* Share & links */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Share & distribute</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <a href={`/p/${portal.slug}`} target="_blank" rel="noopener noreferrer" style={btn("#1a2a2a", "#7df")}>
            Public page
          </a>
          <a href={`/p/${portal.slug}/go`} target="_blank" rel="noopener noreferrer" style={btn("#1a2a2a", "#7df")}>
            QR redirect (/go)
          </a>
          <a
            href={`/api/portals/${portal.id}/share-card`}
            target="_blank"
            rel="noopener noreferrer"
            style={btn("#1a2a1a", "#4ade80")}
          >
            Social share card
          </a>
        </div>
        <div style={s.label}>Copy link</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{ color: "#aaa", fontSize: "0.8rem", wordBreak: "break-all" }}>
            {typeof window !== "undefined" ? `${window.location.origin}/p/${portal.slug}` : `/p/${portal.slug}`}
          </code>
          <button
            type="button"
            style={btn("#333")}
            onClick={() => {
              const url = `${window.location.origin}/p/${portal.slug}`;
              void navigator.clipboard.writeText(url);
              setExportMsg("Link copied");
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Images ({images.length})</h2>
        {images.length === 0 ? (
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            No images uploaded yet.
          </p>
        ) : (
          <div style={s.grid}>
            {images.map((img) => (
              <img
                key={img.id}
                src={`/api/images/${img.id}`}
                alt="Portal image"
                style={s.thumb}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Upload Image</h2>
        <ImageUploader onUpload={handleUpload} />
      </div>

      {/* Delete Confirmation Dialog */}
      {showConfirm && (
        <div style={s.overlay} onClick={() => setShowConfirm(false)}>
          <div
            style={s.confirmBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#ef4444", marginTop: 0 }}>
              Delete Portal?
            </h3>
            <p style={{ color: "#888", fontSize: "0.9rem" }}>
              This permanently deletes the portal, all uploaded images, and
              fingerprints. This cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: "1.25rem",
              }}
            >
              <button
                onClick={() => setShowConfirm(false)}
                style={btn("#333")}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={btn("#3b1a1a", "#ef4444")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
