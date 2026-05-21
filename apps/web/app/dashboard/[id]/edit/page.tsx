"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PortalForm from "@/components/PortalForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";
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
      <div className="ip-empty-state">
        <BalancedText className="ip-muted ip-text-block" lines={["Loading portal…"]} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ip-empty-state" style={{ color: "var(--danger)" }}>
        <BalancedText className="ip-text-block" lines={[error]} />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="ip-empty-state">
        <BalancedText className="ip-muted ip-text-block" lines={["Portal not found."]} />
      </div>
    );
  }

  return (
    <div className="ip-form-shell">
      <PageIntro
        title="Edit Portal"
        lines={["Update title, destination,", "scan mode, & visibility."]}
      />

      {submitError && (
        <div
          className="ip-card"
          style={{
            color: "var(--danger)",
            borderColor: "var(--danger)",
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
