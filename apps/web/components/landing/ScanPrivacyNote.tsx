import Link from "next/link";
import { BalancedText } from "@/components/ui/BalancedText";
import { SCAN_PRIVACY_LINES } from "@/components/landing/content";

export function ScanPrivacyNote() {
  return (
    <div className="ip-landing-scan-privacy">
      <BalancedText
        className="ip-muted ip-text-block ip-copy-sm"
        lines={[...SCAN_PRIVACY_LINES]}
      />
      <Link href="/scan" className="ip-btn ip-btn-secondary ip-btn-sm ip-landing-scan-cta">
        TRY A REAL SCAN →
      </Link>
    </div>
  );
}
