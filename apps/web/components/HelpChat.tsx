"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I'm the RQ Plus help assistant. Ask about creating portals, uploading images, scanning, gallery privacy, or pricing.",
};

function helpReply(input: string): string {
  const m = input.toLowerCase().trim();

  if (/^(hi|hello|hey|help)/.test(m)) {
    return "Ask me anything about RQ Plus — e.g. \"how do I upload?\" or \"why won't my URL work?\"";
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

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: helpReply(text) },
    ]);
  }, [input]);

  return (
    <div className="ip-help-chat">
      {open && (
        <div className="ip-help-chat-panel" role="dialog" aria-label="Help chat">
          <div className="ip-help-chat-header">
            <strong>Help</strong>
            <button
              type="button"
              className="ip-btn ip-btn-ghost ip-btn-sm"
              onClick={() => setOpen(false)}
              aria-label="Close help"
            >
              Close
            </button>
          </div>
          <div className="ip-help-chat-log">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`ip-help-chat-bubble ip-help-chat-${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="ip-help-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="ip-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Help question"
            />
            <button type="submit" className="ip-btn ip-btn-secondary ip-btn-sm" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ip-help-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close help chat" : "Open help chat"}
      >
        {open ? "×" : "?"}
      </button>
    </div>
  );
}
