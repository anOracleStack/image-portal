import { BalancedText } from "@/components/ui/BalancedText";

type PageIntroProps = {
  title: string;
  lines?: readonly string[];
  className?: string;
};

/** Centered page title + optional balanced subtitle lines. */
export function PageIntro({ title, lines, className = "" }: PageIntroProps) {
  return (
    <header className={`ip-page-intro ${className}`.trim()}>
      <h1 className="ip-display ip-page-intro-title">{title}</h1>
      {lines && lines.length > 0 ? (
        <BalancedText className="ip-muted ip-text-block" lines={lines} />
      ) : null}
    </header>
  );
}
