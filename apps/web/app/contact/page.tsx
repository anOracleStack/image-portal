import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { BalancedText } from "@/components/ui/BalancedText";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-section-center ip-marketing-section-narrow ip-panel">
        <PageIntro
          title="Contact"
          lines={[
            "Sales, support, and partnership inquiries for RQ Plus.",
            "We typically reply within one business day.",
          ]}
        />
        <BalancedText
          className="ip-muted ip-text-block ip-copy-md"
          lines={[
            "Use the addresses below for the fastest routing.",
            "For account help, sign in and use in-app chat when available.",
          ]}
        />
        <ul className="ip-text-block ip-muted" style={{ listStyle: "none", padding: 0 }}>
          <li>
            General:{" "}
            <a href="mailto:hello@rub.pub" className="ip-nav-link">
              hello@rub.pub
            </a>
          </li>
          <li>
            Sales:{" "}
            <a href="mailto:sales@rub.pub" className="ip-nav-link">
              sales@rub.pub
            </a>
          </li>
        </ul>
        <Button href="mailto:hello@rub.pub" variant="primary">
          Email us
        </Button>
      </section>
    </MarketingPage>
  );
}
