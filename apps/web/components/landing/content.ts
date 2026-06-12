export const HERO_BADGE = "VISUAL SCAN · PROGRAMMABLE LINKS" as const;

export const HERO_LEAD_LINES = [
  "Turn any image into a doorway.",
  "Upload it, link it anywhere — the image is the key.",
  "Anyone with a camera phone can open your link in seconds.",
] as const;

export const HERO_CTA_PRIMARY = { label: "GET STARTED FREE", href: "/login" } as const;
export const HERO_CTA_SECONDARY = {
  label: "SEE HOW IT WORKS ↓",
  href: "#scan-demo",
} as const;

export const HOW_STEPS = [
  {
    title: "UPLOAD ANY IMAGE",
    lines: [
      "Poster, flyer, menu, screenshot, or artwork.",
      "Upload a file or snap a photo — both work.",
    ],
  },
  {
    title: "LINK A DESTINATION",
    lines: [
      "Website, profile, store, or payment page.",
      "Change it anytime from your dashboard.",
    ],
  },
  {
    title: "SHARE EVERYWHERE",
    lines: [
      "Print, post, or display on any screen.",
      "Viewers scan with the web or installed app.",
    ],
  },
] as const;

export const WHY_ITEMS = [
  {
    title: "NO QR CODES NEEDED",
    lines: [
      "QR codes require a printed code block.",
      "RQ Plus uses the image itself — any print works.",
    ],
  },
  {
    title: "UPDATE ANY TIME, NEVER REPRINT",
    lines: [
      "Change the destination whenever you want.",
      "The printed image stays the same; the link does not move.",
    ],
  },
  {
    title: "RELIABLE SCANNING",
    lines: [
      "Copy-detection embeddings plus verification.",
      "Works on print, glare, & low light conditions.",
    ],
  },
] as const;

export const PRICING_LINES = [
  "Free for 3 portals & 200 scans/month.",
  "Pro plans start at $19 per month.",
] as const;

export const PRICING_CTA = { label: "VIEW FULL PRICING →", href: "/pricing" } as const;

export const CTA_LINES = [
  "Create your first portal in under a minute.",
  "Explore examples — dark or light theme.",
] as const;

export const CTA_PRIMARY = { label: "CREATE FREE ACCOUNT", href: "/login" } as const;
export const CTA_SECONDARY = { label: "BROWSE USE CASES", href: "#use-cases" } as const;

export const SCAN_PRIVACY_LINES = [
  "This guide uses sample images — no camera on this page.",
  "On /scan, one photo is checked on device first; frames are not stored unless a match is logged.",
] as const;
