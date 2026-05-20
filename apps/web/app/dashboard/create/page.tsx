"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import PortalForm from "@/components/PortalForm";

interface PortalValues {
  title: string;
  destinationUrl: string;
  scanMode: "image" | "hybrid";
  visibility: "public" | "private";
}

export default function CreatePortalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: PortalValues) => {
      setError(null);

      try {
        // Get the session user ID by calling the session endpoint
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) throw new Error("Not authenticated");
        const sessionData = await sessionRes.json();
        const ownerId: string = sessionData.user?.id;
        if (!ownerId) throw new Error("Not authenticated");

        const res = await fetch("/api/portals/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, ownerId }),
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
    <div>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
        }}
      >
        Create Portal
      </h1>

      {error && (
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
          {error}
        </div>
      )}

      <PortalForm onSubmit={handleSubmit} submitLabel="Create Portal" />
    </div>
  );
}
