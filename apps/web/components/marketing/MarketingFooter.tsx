import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="ip-footer">
      <div className="ip-container ip-footer-inner">
        <span className="ip-faint ip-footer-copy">
          © {new Date().getFullYear()} RQ Plus
        </span>
        <div className="ip-footer-links">
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
