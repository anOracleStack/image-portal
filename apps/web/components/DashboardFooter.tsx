import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function DashboardFooter() {
  return (
    <footer className="ip-dash-footer">
      <div className="ip-container ip-footer-inner ip-dash-footer-inner">
        <span className="ip-faint ip-footer-copy">
          © {new Date().getFullYear()} RQ Plus
        </span>
        <div className="ip-dash-footer-theme">
          <span className="ip-faint ip-copy-sm">Theme</span>
          <ThemeToggle />
        </div>
        <Link href="/" className="ip-nav-link ip-copy-sm">
          Home
        </Link>
      </div>
    </footer>
  );
}
