import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";

export default function TermsPage() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-section-center ip-marketing-section-narrow ip-panel">
        <PageIntro
          title="Terms of Service"
          lines={[
            "Rules for using RQ Plus portals, scans, and billing.",
            "Full terms are being finalized — check back soon.",
          ]}
        />
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md"
          lines={[
            "By using rub.pub you agree to use the service lawfully",
            "and not to abuse scans, storage, or shared gallery listings.",
            "Paid plans renew per your subscription until you cancel.",
          ]}
        />
        <p className="ip-faint ip-text-block">
          Questions? Email{" "}
          <a href="mailto:legal@rub.pub" className="ip-nav-link">
            legal@rub.pub
          </a>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
