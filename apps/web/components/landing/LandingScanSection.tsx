import { Button } from "@/components/ui/Button";
import { ScanFlowStrip } from "@/components/landing/ScanFlowStrip";
import { ScanPrivacyNote } from "@/components/landing/ScanPrivacyNote";

export function LandingScanSection() {
  return (
    <section
      id="scan-demo"
      className="ip-landing-section ip-landing-scan ip-container ip-section-center"
      data-section-mood="luminous"
    >
      <div className="ip-landing-section-inner ip-landing-scan-inner ip-scan-bridge">
        <h2 className="ip-display ip-section-title ip-landing-section-kicker">QUICK GUIDE</h2>
        <p className="ip-scan-bridge-lead ip-muted">
          Watch the flow above — then try a real scan on your own image.
        </p>
        <ScanFlowStrip activePhase="scan" />
        <ScanPrivacyNote />
        <Button href="/scan" variant="primary" className="ip-btn-hero ip-landing-scan-cta">
          TRY A REAL SCAN →
        </Button>
      </div>
    </section>
  );
}
