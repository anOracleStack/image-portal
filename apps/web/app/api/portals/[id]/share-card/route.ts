import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAppUrl } from "@/lib/app-url";
import sharp from "sharp";

const APP_URL = getAppUrl();

/** Branded 1200×630 OG share card for social previews. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createAdminClient();

  const { data: portal } = await db
    .from("portals")
    .select("title, slug, total_scans")
    .eq("id", id)
    .single();

  if (!portal) {
    return new NextResponse("Not found", { status: 404 });
  }

  const title = (portal.title ?? "RQ Plus").slice(0, 60);
  const scans = portal.total_scans ?? 0;
  const link = `${APP_URL}/p/${portal.slug}`;

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a2a2a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="120" fill="#7df" font-family="system-ui,sans-serif" font-size="28" font-weight="600">RQ PLUS</text>
  <text x="80" y="280" fill="#ededed" font-family="system-ui,sans-serif" font-size="52" font-weight="700">${escapeXml(title)}</text>
  <text x="80" y="360" fill="#888" font-family="system-ui,sans-serif" font-size="28">${scans} scans · Scan to open</text>
  <text x="80" y="520" fill="#4ade80" font-family="system-ui,sans-serif" font-size="22">${escapeXml(link)}</text>
  <rect x="900" y="200" width="220" height="220" rx="16" fill="#141414" stroke="#333" stroke-width="2"/>
  <text x="1010" y="330" text-anchor="middle" fill="#7df" font-family="system-ui,sans-serif" font-size="64">⬡</text>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
