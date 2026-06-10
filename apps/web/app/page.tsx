import { GlowBackground } from "@/components/ui/GlowBackground";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { HelpChat } from "@/components/HelpChat";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
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
    <div className="ip-page ip-landing">
      <GlowBackground />
      <MarketingNav />

      <main className="ip-landing-main">
        <section className="ip-landing-section ip-landing-hero ip-container ip-section-center">
          <div className="ip-landing-section-inner ip-landing-hero-inner">
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
                GET STARTED
              </Button>
              <Button href="#scan-demo" variant="secondary" className="ip-btn-hero ip-btn-hero-cta">
                SEE HOW IT WORKS
              </Button>
            </div>
          </div>
        </section>

        <section
          id="scan-demo"
          className="ip-landing-section ip-landing-scan ip-container ip-section-center"
        >
          <div className="ip-landing-section-inner ip-landing-scan-inner">
            <h2 className="ip-display ip-section-title ip-landing-section-kicker">
              Quick guide
            </h2>
            <ScanDemo />
          </div>
        </section>

        <section
          id="how-it-works"
          className="ip-landing-section ip-landing-how ip-container ip-section-center"
        >
          <div className="ip-landing-section-inner">
            <h2 className="ip-display ip-section-title">How it works</h2>
            <div className="ip-landing-steps-row">
              {howSteps.map((step, i) => (
                <div key={step.title} className="ip-step-block ip-landing-step-card">
                  <span className="ip-step-num">{i + 1}</span>
                  <h3 className="ip-display ip-card-title-sm">{step.title}</h3>
                  <BalancedText
                    className="ip-muted ip-text-block ip-copy-sm"
                    lines={step.lines}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ip-landing-section ip-landing-why ip-container ip-section-center">
          <div className="ip-landing-section-inner">
            <h2 className="ip-display ip-section-title">Why RQ Plus?</h2>
            <div className="ip-landing-cards-row ip-landing-why-row">
              {whyItems.map((item) => (
                <div key={item.title} className="ip-card ip-card-copy ip-why-card ip-landing-compact-card">
                  <h3 className="ip-display ip-card-section-title">{item.title}</h3>
                  <BalancedText
                    className="ip-muted ip-text-block ip-copy-sm"
                    lines={item.lines}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ip-landing-section ip-landing-use-cases ip-container ip-section-center">
          <div className="ip-landing-section-inner">
            <h2 className="ip-display ip-section-title">Use cases</h2>
            <UseCasesSection limit={3} compact />
          </div>
        </section>

        <section className="ip-landing-section ip-landing-pricing ip-container ip-section-center">
          <div className="ip-landing-section-inner ip-landing-pricing-inner">
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
          </div>
        </section>

        <section className="ip-landing-section ip-container ip-section-center ip-landing-cta-section">
          <div className="ip-landing-section-inner">
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
          </div>
        </section>
      </main>

      <MarketingFooter />
      <HelpChat />
    </div>
  );
}
