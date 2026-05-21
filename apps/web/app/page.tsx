import { GlowBackground } from "@/components/ui/GlowBackground";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ScanDemo } from "@/components/landing/ScanDemo";

const useCases = [
  {
    icon: "◫",
    title: "Posters & Flyers",
    lines: [
      "Printed materials that change",
      "with your content.",
      "Update the link without reprinting.",
    ],
  },
  {
    icon: "◎",
    title: "Restaurant Menus",
    lines: [
      "The menu image itself is scannable —",
      "change prices,",
      "& items instantly.",
    ],
  },
  {
    icon: "◇",
    title: "Event Tickets",
    lines: [
      "Link tickets to pages that update",
      "in real time — schedule, venue,",
      "& refunds.",
    ],
  },
  {
    icon: "▣",
    title: "Product Packaging",
    lines: [
      "Packaging becomes a channel",
      "to your brand — manuals, offers,",
      "& unboxing.",
    ],
  },
  {
    icon: "◈",
    title: "Art & Photography",
    lines: [
      "Every physical print becomes",
      "a gallery link collectors can scan.",
    ],
  },
  {
    icon: "◆",
    title: "Business Cards",
    lines: [
      "Your card design is the key —",
      "no separate QR block required.",
    ],
  },
] as const;

const whyItems = [
  {
    title: "No QR codes needed",
    lines: [
      "QR codes require a printed code.",
      "Image Portal uses the image itself —",
      "any existing printed material works.",
    ],
  },
  {
    title: "Update anytime, never reprint",
    lines: [
      "Change the destination whenever you want.",
      "The printed image stays the same;",
      "the link does not.",
    ],
  },
  {
    title: "Reliable scanning",
    lines: [
      "Copy-detection embeddings plus",
      "geometric verification — works on print,",
      "glare,",
      "& low light.",
    ],
  },
] as const;

const howSteps = [
  {
    title: "Upload any image",
    lines: ["Poster, flyer, menu, screenshot,", "or artwork — anything works."],
  },
  {
    title: "Link a destination",
    lines: [
      "Website, profile, store, payment —",
      "change it anytime from your dashboard.",
    ],
  },
  {
    title: "Share everywhere",
    lines: [
      "Print, post, or display on screen.",
      "Viewers scan with their camera —",
      "no app install.",
    ],
  },
] as const;

export default function LandingPage() {
  return (
    <div className="ip-page">
      <GlowBackground />
      <MarketingNav />

      <section className="ip-container ip-hero">
        <p
          className="ip-mono ip-badge ip-badge-accent ip-animate-in"
          style={{ display: "inline-flex", marginBottom: 16 }}
        >
          Visual scan · programmable links
        </p>
        <h1 className="ip-hero-title ip-animate-in ip-animate-in-delay-1">
          Turn any image
          <br />
          <span>into a doorway</span>
        </h1>
        <BalancedText
          className="ip-muted ip-text-block ip-animate-in ip-animate-in-delay-1"
          style={{ fontSize: "1.125rem", maxWidth: 480, lineHeight: 1.7 }}
          lines={[
            "Upload an image. Link it anywhere.",
            "The image is the key — not",
            "the destination.",
            "Anyone with a phone camera",
            "can open your link in seconds.",
          ]}
        />
        <div className="ip-hero-actions ip-animate-in ip-animate-in-delay-2">
          <Button href="/login" variant="primary">
            Get started free
          </Button>
          <Button href="#how-it-works" variant="secondary">
            See how it works ↓
          </Button>
        </div>
        <p className="ip-faint ip-mono" style={{ marginTop: 40, fontSize: "0.75rem" }}>
          No app download · No QR required · Change destinations anytime
        </p>
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
                className="ip-muted ip-text-block"
                style={{ margin: 0, fontSize: "0.9375rem", maxWidth: 400, lineHeight: 1.65 }}
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
                className="ip-muted ip-text-block"
                style={{ margin: 0, fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.6 }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {whyItems.map((item) => (
            <div key={item.title} className="ip-card ip-card-copy">
              <h3 className="ip-display" style={{ margin: "0 0 12px", fontSize: "1rem" }}>
                {item.title}
              </h3>
              <BalancedText
                className="ip-muted ip-text-block"
                style={{ margin: 0, fontSize: "0.9rem", maxWidth: 420, lineHeight: 1.7 }}
                lines={item.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title-sm">Pricing</h2>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ margin: "0 0 24px", maxWidth: 360, fontSize: "1rem" }}
          lines={["Free for 3 portals", "& 200 scans/month.", "Pro plans from $19/month."]}
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
            className="ip-muted ip-text-block"
            style={{ margin: "0 auto 28px", maxWidth: 400, lineHeight: 1.65 }}
            lines={[
              "Create your first portal in under a minute.",
              "Dark or light — your choice in the nav.",
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
