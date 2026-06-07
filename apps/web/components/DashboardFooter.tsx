import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="ip-dash-footer">
      <div className="ip-container ip-footer-inner">
        <span className="ip-faint ip-footer-copy">
          © {new Date().getFullYear()} RQ Plus
        </span>
        <div className="ip-footer-links">
          <Link href="/scan" className="ip-nav-link">
            Scan
          </Link>
          <Link href="/gallery" className="ip-nav-link">
            Gallery
          </Link>
          <Link href="/pricing" className="ip-nav-link">
            Pricing
          </Link>
          <Link href="/dashboard/settings" className="ip-nav-link">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
