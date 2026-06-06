"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import PortalForm from "@/components/PortalForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { usePlanTier } from "@/hooks/usePlanTier";

interface PortalValues {
  title: string;
  destinationUrl: string;
  scanMode: "image" | "hybrid";
  visibility: "public" | "private";
}

export default function CreatePortalPage() {
  const router = useRouter();
  const planTier = usePlanTier();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: PortalValues) => {
      setError(null);

      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) throw new Error("Not authenticated");
        const sessionData = await sessionRes.json();
        const ownerId: string = sessionData.user?.id;
        if (!ownerId) throw new Error("Not authenticated");

        const res = await fetch("/api/portals/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create portal");
        }

        router.push(`/dashboard/${data.portal.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [router]
  );

  return (
    <div className="ip-form-shell">
      <PageIntro
        title="Create Portal"
        lines={[
          "Name your portal & set a destination.",
          "Next: upload or capture your visual,",
          "review the enhanced version, & approve to go live.",
        ]}
      />

      {error && (
        <div className="ip-card ip-card-danger">{error}</div>
      )}

      <PortalForm
        onSubmit={handleSubmit}
        submitLabel="Create Portal"
        planTier={planTier}
      />
    </div>
  );
}
