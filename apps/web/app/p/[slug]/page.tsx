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
      <section className="ip-section-center ip-public-hero">
        <div className="ip-card ip-public-card">
          <h1 className="ip-display ip-public-title">{portal.title}</h1>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-sm ip-public-domain"
            lines={[domain]}
          />

          <a
            href={portal.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ip-btn ip-btn-primary ip-public-cta"
          >
            Visit Destination
          </a>

          <div className="ip-public-links">
            <a href="/gallery" className="ip-muted ip-public-link">
              ← Browse Gallery
            </a>
            <span className="ip-faint">·</span>
            <a href={`/p/${portal.slug}/report`} className="ip-muted ip-public-link">
              Report Abuse
            </a>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
