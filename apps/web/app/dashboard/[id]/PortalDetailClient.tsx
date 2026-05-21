"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import { BalancedText } from "@/components/ui/BalancedText";
import type { PortalRow, PortalImageRow } from "@/lib/types";

interface Props {
  portal: PortalRow;
  images: PortalImageRow[];
  userId: string;
}

const statusBadgeClass: Record<string, string> = {
  active: "ip-badge-success",
  inactive: "ip-badge-muted",
  suspended: "ip-badge-danger",
};

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" as const },
  title: { fontSize: "1.5rem", fontWeight: 700, margin: 0 },
  metaRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" as const },
  sectionTitle: { fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" },
  label: { fontSize: "0.85rem", fontWeight: 500, color: "var(--muted)" },
  value: { fontSize: "0.95rem", color: "var(--foreground)", marginBottom: "0.5rem", opacity: 0.9 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 },
  thumb: {
    width: "100%",
    aspectRatio: "1",
    objectFit: "cover" as const,
    borderRadius: 6,
    background: "var(--bg-elevated)",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "color-mix(in srgb, var(--background) 30%, transparent)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  confirmBox: { maxWidth: 400, textAlign: "center" as const },
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
            <span style={{ color: "var(--accent)" }}>/p/{portal.slug}</span>
            <span className={`ip-badge ${statusBadgeClass[status] ?? "ip-badge-muted"}`}>
              {status}
            </span>
            <span className="ip-muted" style={{ fontSize: "0.85rem" }}>
              {portal.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <a href={`/dashboard/${portal.id}/edit`} className="ip-btn ip-btn-ghost ip-btn-sm">
            Edit
          </a>
          <button type="button" onClick={handleToggleStatus} className="ip-btn ip-btn-secondary ip-btn-sm">
            {status === "active" ? "Deactivate" : "Activate"}
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="ip-btn ip-btn-danger ip-btn-sm">
            Delete
          </button>
          <span className="ip-faint" style={{ fontSize: "0.75rem" }} aria-hidden>
            |
          </span>
          <button
            type="button"
            onClick={() => handleExport("qrcode")}
            disabled={exporting === "qrcode"}
            className="ip-btn ip-btn-secondary ip-btn-sm"
          >
            {exporting === "qrcode" ? "…" : "QR code"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("image_only")}
            disabled={exporting === "image_only" || images.length === 0}
            className="ip-btn ip-btn-secondary ip-btn-sm"
          >
            {exporting === "image_only" ? "…" : "Export image"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("image_qr")}
            disabled={exporting === "image_qr" || images.length === 0}
            className="ip-btn ip-btn-secondary ip-btn-sm"
          >
            {exporting === "image_qr" ? "…" : "Image + QR"}
          </button>
          {exportMsg && (
            <span
              className="ip-muted"
              style={{
                color: exportMsg.startsWith("Exported") ? "var(--success)" : "var(--danger)",
                fontSize: "0.8rem",
                marginLeft: 8,
              }}
            >
              {exportMsg}
            </span>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="ip-display" style={s.sectionTitle}>Details</h2>
        <div style={s.label}>Destination URL</div>
        <div style={s.value}>
          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
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
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="ip-display" style={s.sectionTitle}>Share & distribute</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <a
            href={`/p/${portal.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-ghost ip-btn-sm"
          >
            Public page
          </a>
          <a
            href={`/p/${portal.slug}/go`}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-ghost ip-btn-sm"
          >
            QR redirect (/go)
          </a>
          <a
            href={`/api/portals/${portal.id}/share-card`}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-secondary ip-btn-sm"
          >
            Social share card
          </a>
        </div>
        <div style={s.label}>Copy link</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code className="ip-mono ip-faint" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
            {typeof window !== "undefined" ? `${window.location.origin}/p/${portal.slug}` : `/p/${portal.slug}`}
          </code>
          <button
            type="button"
            className="ip-btn ip-btn-ghost ip-btn-sm"
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
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="ip-display" style={s.sectionTitle}>Images ({images.length})</h2>
        {images.length === 0 ? (
          <BalancedText
            className="ip-muted ip-text-block ip-card-copy"
            style={{ fontSize: "0.9rem" }}
            lines={["No images uploaded yet."]}
          />
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
      <div className="ip-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="ip-display" style={s.sectionTitle}>Upload Image</h2>
        <ImageUploader onUpload={handleUpload} />
      </div>

      {/* Delete Confirmation Dialog */}
      {showConfirm && (
        <div style={s.overlay} onClick={() => setShowConfirm(false)}>
          <div className="ip-card" style={s.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 className="ip-display" style={{ color: "var(--danger)", marginTop: 0 }}>
              Delete portal?
            </h3>
            <BalancedText
              className="ip-muted ip-text-block"
              style={{ fontSize: "0.9rem", lineHeight: 1.6 }}
              lines={[
                "This permanently deletes the portal,",
                "all uploaded images,",
                "& fingerprints.",
                "This cannot be undone.",
              ]}
            />
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: "1.25rem",
              }}
            >
              <button type="button" onClick={() => setShowConfirm(false)} className="ip-btn ip-btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="ip-btn ip-btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
