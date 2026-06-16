import { BalancedText } from "@/components/ui/BalancedText";
import { HOW_STEPS } from "@/components/landing/content";

export function LandingHowSection() {
  return (
    <section
      id="how-it-works"
      className="ip-landing-section ip-landing-how ip-container ip-section-center"
      data-section-mood="signal"
    >
      <div className="ip-landing-section-inner">
        <h2 className="ip-display ip-section-title">HOW IT WORKS</h2>
        <div className="ip-landing-steps-row">
          {HOW_STEPS.map((step, i) => (
            <div key={step.title} className="ip-step-block ip-landing-step-card">
              <span className="ip-step-num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="ip-display ip-card-title-sm">{step.title}</h3>
              <BalancedText
                className="ip-muted ip-text-block ip-copy-sm"
                lines={[...step.lines]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
