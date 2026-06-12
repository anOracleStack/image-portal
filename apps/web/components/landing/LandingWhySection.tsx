import { BalancedText } from "@/components/ui/BalancedText";
import { WHY_ITEMS } from "@/components/landing/content";

export function LandingWhySection() {
  return (
    <section
      id="why"
      className="ip-landing-section ip-landing-why ip-container ip-section-center"
    >
      <div className="ip-landing-section-inner">
        <h2 className="ip-display ip-section-title">WHY RQ PLUS?</h2>
        <div className="ip-landing-cards-row ip-landing-why-row">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="ip-card ip-card-copy ip-why-card ip-landing-compact-card"
            >
              <h3 className="ip-display ip-card-section-title">{item.title}</h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-sm"
                lines={[...item.lines]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
