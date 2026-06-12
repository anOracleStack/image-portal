import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-section-center ip-marketing-section-narrow ip-panel">
        <PageIntro
          title="Privacy"
          lines={[
            "How RQ Plus handles account data, portals, and scan analytics.",
            "A complete policy will be published here shortly.",
          ]}
        />
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md"
          lines={[
            "We collect what you provide to run portals and measure scans.",
            "We do not sell personal data. Processors follow our agreements.",
            "You may request export or deletion by contacting us.",
          ]}
        />
        <p className="ip-faint ip-text-block">
          Privacy requests:{" "}
          <a href="mailto:privacy@rub.pub" className="ip-nav-link">
            privacy@rub.pub
          </a>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
