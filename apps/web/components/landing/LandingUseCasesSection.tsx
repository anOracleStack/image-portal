import { UseCasesSection } from "@/components/landing/UseCasesSection";

export function LandingUseCasesSection() {
  return (
    <section
      id="use-cases"
      className="ip-landing-section ip-landing-use-cases ip-container ip-section-center"
      data-section-mood="signal"
    >
      <div className="ip-landing-section-inner">
        <h2 className="ip-display ip-section-title">USE CASES</h2>
        <UseCasesSection compact limit={3} />
      </div>
    </section>
  );
}
