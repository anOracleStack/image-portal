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
    default: "RQ Plus — Scan any print to open a link",
    template: "%s · RQ Plus",
  },
  description:
    "Turn posters, stickers, & photos into programmable doorways. Visual scan matching — no QR codes — plus analytics & API access.",
  metadataBase: new URL(appUrl),
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "RQ Plus",
    description: "The image is the doorway — visual scan matching without QR codes.",
    url: appUrl,
    siteName: "RQ Plus",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RQ Plus",
    description: "Scan prints to open destinations — built for creators & brands.",
  },
  appleWebApp: {
    capable: true,
    title: "RQ Plus",
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
