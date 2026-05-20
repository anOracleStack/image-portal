import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicPortalPage({ params }: Props) {
  const { slug } = await params;

  const db = createAdminClient();
  const { data: portal, error } = await db
    .from("portals")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !portal) {
    notFound();
  }

  const domain = (() => {
    try {
      return new URL(portal.destination_url).hostname;
    } catch {
      return portal.destination_url;
    }
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ededed",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "#141414",
            border: "1px solid #222",
            borderRadius: 16,
            padding: "2.5rem 2rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              color: "#ededed",
            }}
          >
            {portal.title}
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#666",
              margin: "0 0 1.5rem",
            }}
          >
            {domain}
          </p>

          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#7df",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 10,
              padding: "14px 36px",
              fontSize: "1rem",
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: "1.5rem",
            }}
          >
            Visit Destination
          </a>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              fontSize: "0.82rem",
            }}
          >
            <a
              href="/gallery"
              style={{
                color: "#888",
                textDecoration: "none",
              }}
            >
              &larr; Browse Gallery
            </a>
            <span style={{ color: "#444" }}>&middot;</span>
            <a
              href={`/p/${portal.slug}/report`}
              style={{
                color: "#888",
                textDecoration: "none",
              }}
            >
              Report Abuse
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
