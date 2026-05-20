import type { Metadata, Viewport } from "next";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  title: {
    default: "Image Portal — Scan any image to open a link",
    template: "%s · Image Portal",
  },
  description:
    "Turn posters, stickers, and photos into programmable doorways. Visual scan matching, QR exports, analytics, and API access.",
  metadataBase: new URL(appUrl),
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Image Portal",
    description: "Any image, a programmable doorway.",
    url: appUrl,
    siteName: "Image Portal",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Portal",
    description: "Scan visuals to open destinations — built for creators and brands.",
  },
  appleWebApp: {
    capable: true,
    title: "Image Portal",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0a0a0a", color: "#ededed" }}>
        {children}
      </body>
    </html>
  );
}
