export function GlowBackground({ showGrid = true }: { showGrid?: boolean }) {
  return (
    <div className="ip-glow-bg" aria-hidden>
      {showGrid ? <div className="ip-scan-grid" /> : null}
    </div>
  );
}
