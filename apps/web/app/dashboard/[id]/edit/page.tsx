"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PortalForm from "@/components/PortalForm";
import type { PortalRow } from "@/lib/types";

interface PortalValues {
  title: string;
  destinationUrl: string;
  scanMode: "image" | "hybrid";
  visibility: "public" | "private";
}

export default function EditPortalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [portal, setPortal] = useState<PortalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/portals/${id}`, { method: "GET" });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Portal not found");
          if (res.status === 403) throw new Error("Access denied");
          throw new Error("Failed to load portal");
        }
        const data = await res.json();
        if (!cancelled) setPortal(data.portal as PortalRow);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = useCallback(
    async (values: PortalValues) => {
      setSubmitError(null);

      try {
        const res = await fetch(`/api/portals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            destination_url: values.destinationUrl,
            scan_mode: values.scanMode,
            visibility: values.visibility,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to update portal");
        }

        router.push(`/dashboard/${id}`);
        router.refresh();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [id, router]
  );

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 1rem",
          color: "#888",
        }}
      >
        Loading portal…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 1rem",
          color: "#ef4444",
        }}
      >
        {error}
      </div>
    );
  }

  if (!portal) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 1rem",
          color: "#888",
        }}
      >
        Portal not found.
      </div>
    );
  }

  return (
    <div>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
        }}
      >
        Edit Portal
      </h1>

      {submitError && (
        <div
          style={{
            background: "#2a0a0a",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#ef4444",
            marginBottom: "1rem",
          }}
        >
          {submitError}
        </div>
      )}

      <PortalForm
        initialValues={{
          title: portal.title,
          destinationUrl: portal.destination_url,
          scanMode: portal.scan_mode,
          visibility: portal.visibility,
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
