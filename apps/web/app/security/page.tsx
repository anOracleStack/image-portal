import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

export default function SecurityPage() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-section-center ip-marketing-section-narrow ip-panel">
        <PageIntro
          title="Security"
          lines={[
            "How we protect sign-in, payments, and portal infrastructure.",
            "Detailed security documentation is on the way.",
          ]}
        />
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md"
          lines={[
            "Traffic is served over HTTPS. Sessions use industry-standard auth.",
            "Card payments are handled by Stripe; we do not store full PAN data.",
            "Report vulnerabilities responsibly — we respond promptly.",
          ]}
        />
        <p className="ip-faint ip-text-block">
          Security contact:{" "}
          <a href="mailto:security@rub.pub" className="ip-nav-link">
            security@rub.pub
          </a>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
