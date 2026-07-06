import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageIntro } from "@/components/ui/PageIntro";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <MarketingPage>
      <section className="ip-marketing-section ip-section-center ip-marketing-section-narrow ip-panel">
        <PageIntro
          title="This doorway isn't open"
          lines={[
            "The portal you scanned may have moved, expired, or never existed.",
            "The image is the key — but this one doesn't match an active link.",
          ]}
        />
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "1.5rem",
          }}
        >
          <Button href="/" variant="primary">
            BACK TO HOME
          </Button>
          <Button href="/scan" variant="secondary">
            TRY A SCAN
          </Button>
        </div>
      </section>
    </MarketingPage>
  );
}
