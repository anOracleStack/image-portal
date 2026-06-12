export type ScanFlowPhase = "scan" | "match" | "open";

const PHASES: { id: ScanFlowPhase; label: string }[] = [
  { id: "scan", label: "SCAN" },
  { id: "match", label: "MATCH" },
  { id: "open", label: "OPEN" },
];

type ScanFlowStripProps = {
  activePhase: ScanFlowPhase;
};

export function ScanFlowStrip({ activePhase }: ScanFlowStripProps) {
  return (
    <div className="ip-scan-demo-flow" aria-hidden>
      {PHASES.map((phase, index) => (
        <span key={phase.id} className="ip-scan-demo-flow-group">
          <span
            className={`ip-scan-demo-flow-item${activePhase === phase.id ? " ip-scan-demo-flow-active" : ""}`}
            data-active={activePhase === phase.id ? "true" : "false"}
          >
            <span className="ip-scan-demo-flow-bracket" aria-hidden>
              [
            </span>
            <span className="ip-scan-demo-flow-label">{phase.label}</span>
            <span className="ip-scan-demo-flow-bracket" aria-hidden>
              ]
            </span>
          </span>
          {index < PHASES.length - 1 ? (
            <span className="ip-scan-demo-flow-sep" aria-hidden>
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
