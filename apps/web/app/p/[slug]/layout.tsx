import type { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase-admin";

const appUrl = getAppUrl();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = createAdminClient();
  const { data: portal } = await db
    .from("portals")
    .select("id, title")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!portal) {
    return { title: "Portal not found" };
  }

  const ogImage = `${appUrl}/api/portals/${portal.id}/share-card`;

  return {
    title: portal.title,
    description: `Scan to open — ${portal.title} on RQ Plus`,
    openGraph: {
      title: portal.title,
      description: "Scan this visual to open its destination.",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: portal.title,
      images: [ogImage],
    },
  };
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
