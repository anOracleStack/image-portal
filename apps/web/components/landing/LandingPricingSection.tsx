import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { PRICING_CTA, PRICING_LINES } from "@/components/landing/content";

export function LandingPricingSection() {
  return (
    <section
      id="pricing"
      className="ip-landing-section ip-landing-pricing ip-container ip-section-center"
      data-section-mood="portal"
    >
      <div className="ip-landing-section-inner ip-landing-pricing-inner ip-landing-pricing-card">
        <h2 className="ip-display ip-section-title-sm">PRICING</h2>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md ip-mb-lg ip-landing-pricing-copy"
          lines={[...PRICING_LINES]}
        />
        <Button href={PRICING_CTA.href} variant="secondary" className="ip-btn-hero">
          {PRICING_CTA.label}
        </Button>
      </div>
    </section>
  );
}
