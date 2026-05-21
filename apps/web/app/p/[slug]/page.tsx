import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { MarketingPage } from "@/components/marketing/MarketingPage";
import { BalancedText } from "@/components/ui/BalancedText";

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
    <MarketingPage>
      <section
        className="ip-section-center"
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
        }}
      >
        <div className="ip-card ip-public-card">
          <h1 className="ip-display" style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
            {portal.title}
          </h1>
          <BalancedText
            className="ip-muted ip-text-block"
            style={{ margin: "0 0 1.5rem", fontSize: "0.85rem" }}
            lines={[domain]}
          />

          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-primary"
            style={{ marginBottom: "1.5rem", display: "inline-block" }}
          >
            Visit Destination
          </a>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              fontSize: "0.82rem",
              flexWrap: "wrap",
            }}
          >
            <a href="/gallery" className="ip-muted" style={{ textDecoration: "none" }}>
              ← Browse Gallery
            </a>
            <span className="ip-faint">·</span>
            <a
              href={`/p/${portal.slug}/report`}
              className="ip-muted"
              style={{ textDecoration: "none" }}
            >
              Report Abuse
            </a>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
