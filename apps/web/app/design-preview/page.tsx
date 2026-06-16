import Link from "next/link";
import { GlowBackground } from "@/components/ui/GlowBackground";

export const metadata = {
  title: "Design Preview",
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return (
    <div className="ip-page ip-design-preview">
      <GlowBackground variant="portal" />
      <header className="ip-design-preview-header">
        <h1>LANDING MOOD PREVIEW</h1>
        <p>
          Four moods in one design world — Portal Dark, Luminous Demo,
          Signal Brutalist, & the hybrid scroll stack for /.
        </p>
        <p className="ip-mt-md">
          <Link href="/" className="ip-btn ip-btn-secondary ip-btn-sm">
            ← BACK TO LANDING
          </Link>
        </p>
      </header>

      <div className="ip-design-preview-grid">
        <div className="ip-design-preview-panel">
          <div className="ip-design-preview-label">1 · PORTAL DARK</div>
          <div
            className="ip-design-preview-canvas"
            data-section-mood="portal"
          >
            <div className="ip-design-preview-mock-hero">
              <span className="ip-design-preview-mock-badge">
                VISUAL SCAN · PROGRAMMABLE LINKS
              </span>
              <p className="ip-design-preview-mock-title">
                TURN ANY IMAGE
                <br />
                INTO A DOORWAY
              </p>
              <p className="ip-hero-subtitle ip-hero-cap" style={{ fontSize: "0.75rem", marginTop: 8 }}>
                NEXT GENERATION QR CODE
              </p>
            </div>
          </div>
        </div>

        <div className="ip-design-preview-panel">
          <div className="ip-design-preview-label">2 · LUMINOUS DEMO</div>
          <div
            className="ip-design-preview-canvas"
            data-section-mood="luminous"
          >
            <div className="ip-design-preview-mock-card">
              <div className="ip-design-preview-mock-flow">
                [SCAN] → [MATCH] → [OPEN]
              </div>
              <div
                style={{
                  height: 120,
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--bg)) 0%, var(--bg-elevated) 100%)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                LIVE PREVIEW
              </div>
            </div>
          </div>
        </div>

        <div className="ip-design-preview-panel">
          <div className="ip-design-preview-label">3 · SIGNAL BRUTALIST</div>
          <div
            className="ip-design-preview-canvas"
            data-section-mood="signal"
          >
            <div className="ip-design-preview-mock-signal-grid">
              <div className="ip-design-preview-mock-signal-cell">01 UPLOAD</div>
              <div className="ip-design-preview-mock-signal-cell">02 LINK</div>
              <div className="ip-design-preview-mock-signal-cell">03 SHARE</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ip-design-preview-hybrid">
        <div className="ip-design-preview-label">4 · HYBRID STACK (AS ON /)</div>
        <div className="ip-design-preview-hybrid-stack">
          <div data-section-mood="portal" className="ip-design-preview-mock-hero">
            <span className="ip-design-preview-mock-badge">HERO · PORTAL</span>
            <p className="ip-design-preview-mock-title" style={{ fontSize: "1.1rem" }}>
              THRESHOLD
            </p>
          </div>
          <div
            data-section-mood="luminous"
            className="ip-design-preview-canvas"
            style={{ minHeight: 160 }}
          >
            <span className="ip-design-preview-mock-badge">SCAN · LUMINOUS</span>
          </div>
          <div
            data-section-mood="signal"
            className="ip-design-preview-canvas"
            style={{ minHeight: 120 }}
          >
            <span className="ip-design-preview-mock-badge">HOW · SIGNAL</span>
          </div>
          <div data-section-mood="portal" className="ip-design-preview-mock-hero">
            <span className="ip-design-preview-mock-badge">CTA · PORTAL RETURN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
