import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import {
  HERO_BADGE,
  HERO_CTA_PRIMARY,
  HERO_CTA_SECONDARY,
  HERO_LEAD_LINES,
} from "@/components/landing/content";

export function LandingHeroSection() {
  return (
    <section className="ip-landing-section ip-landing-hero ip-container ip-section-center" id="hero">
      <div className="ip-landing-section-inner ip-landing-hero-inner">
        <div className="ip-hero-badge-wrap ip-animate-in">
          <p className="ip-mono ip-badge ip-badge-accent">{HERO_BADGE}</p>
        </div>
        <HeroHeadline />
        <div className="ip-hero-body ip-animate-in ip-animate-in-delay-1">
          <BalancedText
            className="ip-muted ip-text-block ip-hero-lead ip-copy-md"
            lines={[...HERO_LEAD_LINES]}
          />
        </div>
        <div className="ip-hero-actions ip-animate-in ip-animate-in-delay-2">
          <Button
            href={HERO_CTA_PRIMARY.href}
            variant="primary"
            className="ip-btn-hero ip-btn-hero-cta"
          >
            {HERO_CTA_PRIMARY.label}
          </Button>
          <Button
            href={HERO_CTA_SECONDARY.href}
            variant="secondary"
            className="ip-btn-hero ip-btn-hero-cta"
          >
            {HERO_CTA_SECONDARY.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
