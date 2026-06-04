"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import { BalancedText } from "@/components/ui/BalancedText";
import { canHideFromGallery, type PlanTier } from "@/lib/plans";
import type { PortalRow, PortalImageRow } from "@/lib/types";

interface Props {
  portal: PortalRow;
  images: PortalImageRow[];
  userId: string;
  planTier: PlanTier;
}

const statusBadgeClass: Record<string, string> = {
  active: "ip-badge-success",
  inactive: "ip-badge-muted",
  suspended: "ip-badge-danger",
};

export default function PortalDetailClient({
  portal,
  images,
  userId,
  planTier,
}: Props) {
  const router = useRouter();
  const galleryEditable = canHideFromGallery(planTier);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(portal.status);
  const [visibility, setVisibility] = useState(portal.visibility);
  const [galleryBusy, setGalleryBusy] = useState(false);
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
    [portal.id, router, userId]
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

  const handleGalleryVisibility = useCallback(async () => {
    if (!galleryEditable) return;
    const next = visibility === "public" ? "private" : "public";
    setGalleryBusy(true);
    try {
      const res = await fetch(`/api/portals/${portal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setVisibility(data.portal.visibility);
      router.refresh();
    } catch {
      alert("Failed to update gallery visibility.");
    } finally {
      setGalleryBusy(false);
    }
  }, [galleryEditable, portal.id, router, visibility]);

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
        setExportMsg("Exported — download started");
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

  const exportMsgClass =
    exportMsg?.startsWith("Exported") || exportMsg === "Link copied"
      ? "ip-export-msg ip-export-msg-success"
      : "ip-export-msg ip-export-msg-error";

  return (
    <div className="ip-dash-page-wide">
      <div className="ip-detail-header">
        <div className="ip-detail-title-wrap">
          <h1 className="ip-detail-title">{portal.title}</h1>
          <div className="ip-detail-meta">
            <span className="ip-detail-slug ip-mono">/p/{portal.slug}</span>
            <span className={`ip-badge ${statusBadgeClass[status] ?? "ip-badge-muted"}`}>
              {status}
            </span>
            <span className="ip-muted ip-meta-muted-sm">
              {visibility === "public" ? "In gallery" : "Hidden from gallery"}
            </span>
          </div>
        </div>
        <div className="ip-detail-actions">
          <a href={`/dashboard/${portal.id}/edit`} className="ip-btn ip-btn-ghost ip-btn-sm">
            Edit
          </a>
          <button type="button" onClick={handleToggleStatus} className="ip-btn ip-btn-secondary ip-btn-sm">
            {status === "active" ? "Deactivate" : "Activate"}
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="ip-btn ip-btn-danger ip-btn-sm">
            Delete
          </button>
          <span className="ip-faint ip-actions-divider" aria-hidden>
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
            <span className={exportMsgClass}>{exportMsg}</span>
          )}
        </div>
      </div>

      <div className="ip-card ip-card-spaced-lg">
        <h2 className="ip-card-section-title">Details</h2>
        <div className="ip-detail-label">Destination URL</div>
        <div className="ip-detail-value">
          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-link-accent"
          >
            {domain}
          </a>
        </div>
        <div className="ip-detail-label">Scan mode</div>
        <div className="ip-detail-value">{portal.scan_mode}</div>
        <div className="ip-detail-label">Public gallery</div>
        <div className="ip-detail-value ip-gallery-privacy-row">
          <span>
            {visibility === "public"
              ? "Listed on /gallery"
              : "Not listed on /gallery"}
          </span>
          {galleryEditable ? (
            <button
              type="button"
              className="ip-btn ip-btn-secondary ip-btn-sm"
              disabled={galleryBusy}
              onClick={handleGalleryVisibility}
            >
              {galleryBusy
                ? "…"
                : visibility === "public"
                  ? "Hide from gallery"
                  : "Show in gallery"}
            </button>
          ) : (
            <Link href="/pricing" className="ip-link-accent ip-copy-sm">
              Upgrade to hide from gallery
            </Link>
          )}
        </div>
        <div className="ip-detail-label">Total Scans</div>
        <div className="ip-detail-value">{portal.total_scans}</div>
        <div className="ip-detail-label">Last Scanned</div>
        <div className="ip-detail-value">
          {portal.last_scanned_at
            ? new Date(portal.last_scanned_at).toLocaleString()
            : "Never"}
        </div>
        <div className="ip-detail-label">Created</div>
        <div className="ip-detail-value ip-detail-value-last">
          {new Date(portal.created_at).toLocaleString()}
        </div>
      </div>

      <div className="ip-card ip-card-spaced-lg">
        <h2 className="ip-card-section-title">Share & distribute</h2>
        <div className="ip-share-actions">
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
        <div className="ip-detail-label">Copy link</div>
        <div className="ip-copy-link-row">
          <code className="ip-mono ip-faint ip-copy-link-code">
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

      <div className="ip-card ip-card-spaced-lg">
        <h2 className="ip-card-section-title">Images ({images.length})</h2>
        {images.length === 0 ? (
          <BalancedText
            className="ip-muted ip-text-block ip-card-copy ip-copy-sm"
            lines={["No images uploaded yet."]}
          />
        ) : (
          <div className="ip-detail-grid">
            {images.map((img) => (
              <img
                key={img.id}
                src={`/api/images/${img.id}`}
                alt="Portal image"
                className="ip-detail-thumb"
              />
            ))}
          </div>
        )}
      </div>

      <div className="ip-card ip-card-spaced-lg">
        <h2 className="ip-card-section-title">Upload Image</h2>
        <ImageUploader onUpload={handleUpload} />
      </div>

      {showConfirm && (
        <div className="ip-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="ip-card ip-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="ip-display ip-modal-title-danger">
              Delete portal?
            </h3>
            <BalancedText
              className="ip-muted ip-text-block ip-copy-sm"
              lines={[
                "This permanently deletes the portal,",
                "all uploaded images,",
                "& fingerprints.",
                "This cannot be undone.",
              ]}
            />
            <div className="ip-modal-actions">
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
