import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="ip-footer">
      <div className="ip-container" style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center" }}>
        <span className="ip-faint" style={{ fontSize: "0.875rem" }}>
          © {new Date().getFullYear()} Image Portal
        </span>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/gallery" className="ip-nav-link">
            Gallery
          </Link>
          <Link href="/pricing" className="ip-nav-link">
            Pricing
          </Link>
          <Link href="/login" className="ip-nav-link">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
