import { GlowBackground } from "@/components/ui/GlowBackground";
import { HelpChat } from "@/components/HelpChat";
import { LandingScaleShell } from "@/components/LandingScaleShell";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LandingHeroSection } from "@/components/landing/LandingHeroSection";
import { LandingScanSection } from "@/components/landing/LandingScanSection";
import { LandingHowSection } from "@/components/landing/LandingHowSection";
import { LandingWhySection } from "@/components/landing/LandingWhySection";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingPricingSection } from "@/components/landing/LandingPricingSection";
import { LandingCtaSection } from "@/components/landing/LandingCtaSection";

export default function LandingPage() {
  return (
    <LandingScaleShell>
      <div className="ip-page ip-landing">
        <GlowBackground />
        <MarketingNav />
        <main className="ip-landing-main">
          <LandingHeroSection />
          <LandingScanSection />
          <LandingHowSection />
          <LandingWhySection />
          <LandingUseCasesSection />
          <LandingPricingSection />
          <LandingCtaSection />
        </main>
        <MarketingFooter attached />
        <HelpChat inScale />
      </div>
    </LandingScaleShell>
  );
}
