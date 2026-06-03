import { GlowBackground } from "@/components/ui/GlowBackground";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AppDownloadStrip } from "@/components/marketing/AppDownloadStrip";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import { ScanDemo } from "@/components/landing/ScanDemo";

const useCases = [
  {
    icon: "◫",
    title: "Posters & Flyers",
    lines: [
      "Printed materials that change with your content.",
      "Update the link anytime — no reprinting needed.",
    ],
  },
  {
    icon: "◎",
    title: "Restaurant Menus",
    lines: [
      "The menu image itself is scannable.",
      "Change prices & items instantly from your dashboard.",
    ],
  },
  {
    icon: "◇",
    title: "Event Tickets",
    lines: [
      "Link tickets in real time from one image.",
      "Update schedule, venue, & refunds on the fly.",
    ],
  },
  {
    icon: "▣",
    title: "Product Packaging",
    lines: [
      "Packaging becomes a channel to your brand.",
      "Manuals, offers, & unboxing — one scan away.",
    ],
  },
  {
    icon: "◈",
    title: "Art & Photography",
    lines: [
      "Every physical print becomes a gallery link.",
      "Collectors scan to view, buy, or learn more.",
    ],
  },
  {
    icon: "◆",
    title: "Business Cards",
    lines: [
      "Your card design is the key to your link.",
      "No separate QR block required on the card.",
    ],
  },
] as const;

const whyItems = [
  {
    title: "No QR Codes Needed",
    lines: [
      "QR codes require a printed code block.",
      "Image Portal uses the image itself — any print works.",
    ],
  },
  {
    title: "Update Anytime, Never Reprint",
    lines: [
      "Change the destination whenever you want.",
      "The printed image stays the same; the link does not.",
    ],
  },
  {
    title: "Reliable Scanning",
    lines: [
      "Copy-detection embeddings plus verification.",
      "Works on print, glare, & low light conditions.",
    ],
  },
] as const;

const howSteps = [
  {
    title: "Upload any image",
    lines: [
      "Poster, flyer, menu, screenshot, or artwork.",
      "Upload a file or snap a photo — both work.",
    ],
  },
  {
    title: "Link a destination",
    lines: [
      "Website, profile, store, or payment page.",
      "Change it anytime from your dashboard.",
    ],
  },
  {
    title: "Share everywhere",
    lines: [
      "Print, post, or display on any screen.",
      "Viewers scan with the web or installed app.",
    ],
  },
] as const;

export default function LandingPage() {
  return (
    <div className="ip-page">
      <GlowBackground />
      <MarketingNav />

      <section className="ip-container ip-hero ip-section-center">
        <div className="ip-hero-badge-wrap ip-animate-in">
          <p className="ip-mono ip-badge ip-badge-accent">
            Visual scan · programmable links
          </p>
        </div>
        <HeroHeadline />
        <div className="ip-hero-body ip-animate-in ip-animate-in-delay-1">
          <BalancedText
            className="ip-muted ip-text-block ip-hero-lead ip-copy-md"
            lines={[
              "Link any image to the URL of your choice —",
              "like a QR code, only not outdated or unattractive.",
              "Upload your file or snap a photo on your phone.",
              "We reimagine the visual — you approve it,",
              "then link it to any destination you choose.",
            ]}
          />
        </div>
        <div className="ip-hero-actions ip-animate-in ip-animate-in-delay-2">
          <Button href="/login" variant="primary" className="ip-btn-hero">
            Get started free
          </Button>
          <Button href="#how-it-works" variant="secondary" className="ip-btn-hero">
            See how it works ↓
          </Button>
        </div>
        <AppDownloadStrip />
        <ScanDemo />
      </section>

      <section id="how-it-works" className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title">How it works</h2>
        <div className="ip-steps-flow">
          {howSteps.map((step, i) => (
            <div key={step.title} className="ip-step-block">
              <span className="ip-step-num">{i + 1}</span>
              <h3 className="ip-display" style={{ margin: 0, fontSize: "1.125rem" }}>
                {step.title}
              </h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-md"
                style={{ margin: 0, maxWidth: "38ch", lineHeight: 1.65 }}
                lines={step.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title">Use cases</h2>
        <div className="ip-grid-3">
          {useCases.map((c) => (
            <div key={c.title} className="ip-card ip-card-interactive ip-card-glow ip-card-copy">
              <span
                className="ip-mono"
                style={{ fontSize: "1.5rem", color: "var(--accent)", display: "block" }}
                aria-hidden
              >
                {c.icon}
              </span>
              <h3 className="ip-display" style={{ margin: "16px 0 8px", fontSize: "1.05rem" }}>
                {c.title}
              </h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-sm"
                style={{ margin: 0, maxWidth: "32ch", lineHeight: 1.6 }}
                lines={c.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center" style={{ maxWidth: 640 }}>
        <h2 className="ip-display ip-section-title" style={{ marginBottom: 40 }}>
          Why Image Portal?
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            alignItems: "center",
            width: "100%",
          }}
        >
          {whyItems.map((item) => (
            <div
              key={item.title}
              className="ip-card ip-card-copy"
              style={{ width: "100%", maxWidth: 480 }}
            >
              <h3 className="ip-display" style={{ margin: "0 0 12px", fontSize: "1rem" }}>
                {item.title}
              </h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-sm"
                style={{ margin: 0, maxWidth: "36ch", lineHeight: 1.65 }}
                lines={item.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title-sm">Pricing</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md"
          style={{ margin: "0 0 24px", maxWidth: "34ch" }}
          lines={[
            "Free for 3 portals & 200 scans/month.",
            "Pro plans start at $19 per month.",
          ]}
        />
        <Button href="/pricing" variant="secondary">
          View full pricing →
        </Button>
      </section>

      <section className="ip-container ip-section-center" style={{ paddingBottom: 80 }}>
        <div className="ip-card ip-card-glow ip-card-copy" style={{ padding: "3rem 2rem" }}>
          <h2 className="ip-hero-title" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", marginBottom: 16 }}>
            Ready to <span>open the door</span>?
          </h2>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-md"
            style={{ margin: "0 auto 28px", maxWidth: "36ch", lineHeight: 1.65 }}
            lines={[
              "Create your first portal in under a minute.",
              "Dark or light theme — your choice in the nav.",
            ]}
          />
          <Button href="/login" variant="primary">
            Create free account
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
