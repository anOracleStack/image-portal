import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";
import { CTA_LINES, CTA_PRIMARY, CTA_SECONDARY } from "@/components/landing/content";
import { USE_CASES, demoAssetPath } from "@/lib/use-cases";

export function LandingCtaSection() {
  const thumbs = USE_CASES.slice(0, 3);

  return (
    <section
      id="gallery-cta"
      className="ip-landing-section ip-container ip-section-center ip-landing-cta-section"
      data-section-mood="portal"
    >
      <div className="ip-landing-section-inner">
        <div className="ip-card ip-card-glow ip-card-copy ip-landing-cta-card">
          <div className="ip-landing-cta-thumbs" aria-hidden>
            {thumbs.map((useCase) => (
              <div key={useCase.slug} className="ip-landing-cta-thumb">
                <Image
                  src={demoAssetPath(useCase.slug, "thumb")}
                  alt=""
                  width={64}
                  height={48}
                  className="ip-landing-cta-thumb-img"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <h2 className="ip-hero-title ip-landing-cta-title">
            Ready to <span className="ip-hero-grabber-accent">open the door</span>?
          </h2>
          <BalancedText
            className="ip-muted ip-text-block ip-copy-md ip-landing-cta-copy"
            lines={[...CTA_LINES]}
          />
          <div className="ip-landing-cta-actions">
            <Button href={CTA_PRIMARY.href} variant="primary" className="ip-btn-hero">
              {CTA_PRIMARY.label}
            </Button>
            <Button href={CTA_SECONDARY.href} variant="secondary" className="ip-btn-hero">
              {CTA_SECONDARY.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
