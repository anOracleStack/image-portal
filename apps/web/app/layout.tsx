import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getAppUrl } from "@/lib/app-url";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: {
    default: "Image Portal — Scan any image to open a link",
    template: "%s · Image Portal",
  },
  description:
    "Turn posters, stickers, & photos into programmable doorways. Visual scan matching, QR exports, analytics, & API access.",
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
    description: "Scan visuals to open destinations — built for creators & brands.",
  },
  appleWebApp: {
    capable: true,
    title: "Image Portal",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#060608" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
