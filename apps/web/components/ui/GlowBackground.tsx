export function GlowBackground({
  showGrid = true,
  variant = "default",
}: {
  showGrid?: boolean;
  variant?: "default" | "portal";
}) {
  return (
    <div
      className={`ip-glow-bg${variant === "portal" ? " ip-glow-bg-portal ip-glow-bg-cinema" : ""}`}
      aria-hidden
    >
      {variant === "portal" ? (
        <>
          <div className="ip-glow-portal-mesh" />
          <div className="ip-glow-portal-beam" />
          <div className="ip-glow-portal-orb ip-glow-portal-orb-a" />
          <div className="ip-glow-portal-orb ip-glow-portal-orb-b" />
          <div className="ip-glow-cinema-grid" />
        </>
      ) : null}
      {showGrid ? <div className="ip-scan-grid" /> : null}
      {variant === "portal" ? <div className="ip-glow-portal-sweep" /> : null}
    </div>
  );
}
