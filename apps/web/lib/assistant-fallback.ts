import type { EnhanceOptions } from "@ip/vision";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type WorkshopReply = {
  reply: string;
  adjust?: EnhanceOptions;
  wantsApprove?: boolean;
};

/** Rule-based help replies when OPENAI_API_KEY is absent or LLM fails. */
export function helpReplyFallback(input: string): string {
  const m = input.toLowerCase().trim();

  if (/^(hi|hello|hey|help)/.test(m)) {
    return 'Ask me anything about RQ Plus — e.g. "how do I upload?" or "why won\'t my URL work?"';
  }
  if (/upload|image|photo|workshop|reference/.test(m)) {
    return "Open your portal → Workshop your visual → drop or browse for JPEG/PNG/WebP (max 10 MB). You'll see a preview while it uploads. When the enhanced version looks right, hit Approve & go live.";
  }
  if (/url|destination|link|nike|domain|https/.test(m)) {
    return "On Create Portal, type any website like methodmoirai.com — we add https:// automatically. You don't need to type http:// or www unless your site requires it.";
  }
  if (/scan|camera|viewer|pwa|rub\.pub\/scan/.test(m)) {
    return "Viewers open rub.pub/scan in their browser (add to home screen for a PWA). They capture your print once — we match the visual to your portal, then open your destination. No QR codes needed.";
  }
  if (/qr|barcode/.test(m)) {
    return "RQ Plus replaces QR codes with visual matching. Export your approved image for print or screen — viewers scan with rub.pub/scan, not the stock Camera app's QR reader.";
  }
  if (/gallery|public|private|hide/.test(m)) {
    return "Free plan portals appear in the public gallery. Indie & above can hide a portal from /gallery while scan & direct links still work — toggle it on the portal page or upgrade at /pricing.";
  }
  if (/price|plan|upgrade|indie|studio|subscription|stripe/.test(m)) {
    return "See /pricing for Indie, Studio, & Agency tiers. Billing & invoices are in Dashboard → Settings after you subscribe.";
  }
  if (/export|print|download|png/.test(m)) {
    return "After approval, use Export image on your portal page to download a print-ready PNG. Share /p/your-slug or let people scan at rub.pub/scan.";
  }
  if (/login|sign|google|account|password/.test(m)) {
    return "Sign in at /login with email or Google. After signup, confirm your email if prompted, then head to Dashboard → Create Portal.";
  }
  if (/stuck|broken|not work|error|fail/.test(m)) {
    return "Try a hard refresh (Cmd+Shift+R). For uploads, use JPEG or PNG under 10 MB. If an error appears under the upload area, tell us the exact message — your references should stay visible even if enhancement hiccups.";
  }
  if (/contact|human|support|email/.test(m)) {
    return "For account or billing issues, email support from the address on your Stripe receipt or reply in your project thread. Include your portal slug & a screenshot if something's broken.";
  }

  return "I can help with uploads, destination URLs, scanning, gallery privacy, exports, & pricing. Try asking in your own words, or open Dashboard → Create Portal to get started.";
}

/** Rule-based workshop replies when OPENAI_API_KEY is absent or LLM fails. */
export function workshopReplyFallback(
  message: string,
  refCount: number,
): WorkshopReply {
  const m = message.toLowerCase().trim();

  if (/^(approve|approved|go live|looks good|perfect|done|ship it)/.test(m)) {
    return {
      reply:
        "Great — hit Approve & go live when you're ready. I'll register the visual and activate scanning.",
      wantsApprove: true,
    };
  }

  if (refCount === 0) {
    return {
      reply: "Upload at least one image first — use the upload area above or drag files in.",
    };
  }

  const adjust: EnhanceOptions = {};

  if (/bright|lighter|lighten/.test(m)) adjust.brightness = 1.12;
  if (/dark|darker|dim/.test(m)) adjust.brightness = 0.88;
  if (/sharp|crisp|detail/.test(m)) adjust.sharpness = 1.8;
  if (/soft|smooth|blur/.test(m)) adjust.sharpness = 0.7;
  if (/contrast|punch|pop/.test(m)) adjust.contrast = 1.15;
  if (/high.?res|upscale|bigger|larger|hq|quality/.test(m)) adjust.maxEdge = 2560;

  if (Object.keys(adjust).length > 0) {
    const parts = [];
    if (adjust.brightness) parts.push(adjust.brightness > 1 ? "brighter" : "darker");
    if (adjust.sharpness) parts.push(adjust.sharpness > 1.2 ? "sharper" : "softer");
    if (adjust.contrast) parts.push("more contrast");
    if (adjust.maxEdge) parts.push("higher resolution");
    return {
      reply: `Updating the enhanced preview (${parts.join(", ")})…`,
      adjust,
    };
  }

  if (/reference|original|source/.test(m)) {
    return {
      reply: `I'm using your first upload as the primary visual (${refCount} reference${refCount === 1 ? "" : "s"} on file). Ask for brighter, sharper, or more contrast, or approve when it looks right.`,
    };
  }

  return {
    reply:
      'I can adjust the enhanced preview — try: "make it brighter", "sharper", "more contrast", or "higher quality". When you\'re happy, say "approve" or use the Approve button.',
  };
}
