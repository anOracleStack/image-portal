import { GlowBackground } from "@/components/ui/GlowBackground";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { HelpChat } from "@/components/HelpChat";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AppDownloadStrip } from "@/components/marketing/AppDownloadStrip";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import { ScanDemo } from "@/components/landing/ScanDemo";
import { UseCasesSection } from "@/components/landing/UseCasesSection";

const whyItems = [
  {
    title: "No QR Codes Needed",
    lines: [
      "QR codes require a printed code block.",
      "RQ Plus uses the image itself — any print works.",
    ],
  },
  {
    title: "Update Any Time, Never Reprint",
    lines: [
      "Change the destination whenever you want.",
      "The printed image stays the same; the link does not move.",
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
              "Turn any image into a doorway.",
              "Upload it, link it anywhere — the image is the key.",
              "Anyone with a camera phone can open your link in seconds.",
            ]}
          />
        </div>
        <div className="ip-hero-actions ip-animate-in ip-animate-in-delay-2">
          <Button href="/login" variant="primary" className="ip-btn-hero ip-btn-hero-cta">
            GET STARTED FREE
          </Button>
          <Button href="#how-it-works" variant="secondary" className="ip-btn-hero ip-btn-hero-cta">
            SEE HOW IT WORKS ↓
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
              <h3 className="ip-display ip-card-title-sm">{step.title}</h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-md"
                lines={step.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title">Use cases</h2>
        <UseCasesSection />
      </section>

      <section className="ip-container ip-section ip-section-center ip-landing-narrow">
        <h2 className="ip-display ip-section-title">Why RQ Plus?</h2>
        <div className="ip-why-stack">
          {whyItems.map((item) => (
            <div key={item.title} className="ip-card ip-card-copy ip-why-card">
              <h3 className="ip-display ip-card-section-title">{item.title}</h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-sm"
                lines={item.lines}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section ip-section-center">
        <h2 className="ip-display ip-section-title-sm">Pricing</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md ip-mb-lg"
          lines={[
            "Free for 3 portals & 200 scans/month.",
            "Pro plans start at $19 per month.",
          ]}
        />
        <Button href="/pricing" variant="secondary">
          View full pricing →
        </Button>
      </section>

      <section className="ip-container ip-section-center ip-landing-cta-section">
        <div className="ip-card ip-card-glow ip-card-copy ip-landing-cta-card">
          <h2 className="ip-hero-title ip-landing-cta-title">
            Ready to <span>open the door</span>?
          </h2>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-md ip-landing-cta-copy"
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
      <HelpChat />
    </div>
  );
}
