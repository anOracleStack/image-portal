import { ScanDemo } from "@/components/landing/ScanDemo";
import { ScanPrivacyNote } from "@/components/landing/ScanPrivacyNote";

export function LandingScanSection() {
  return (
    <section
      id="scan-demo"
      className="ip-landing-section ip-landing-scan ip-container ip-section-center ip-scan-grid-boost"
    >
      <div className="ip-landing-section-inner ip-landing-scan-inner">
        <h2 className="ip-display ip-section-title ip-landing-section-kicker">QUICK GUIDE</h2>
        <ScanDemo />
        <ScanPrivacyNote />
      </div>
    </section>
  );
}
