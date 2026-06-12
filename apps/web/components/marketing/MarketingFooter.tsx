"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const footerLinks = [
  { href: "/terms", label: "Legal" },
  { href: "/privacy", label: "Privacy" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
] as const;

type MarketingFooterProps = {
  /** Attached below landing sections inside scale shell (not viewport-fixed). */
  attached?: boolean;
};

export function MarketingFooter({ attached = false }: MarketingFooterProps) {
  return (
    <footer
      className={`ip-footer${attached ? " ip-landing-footer-attached" : " ip-marketing-footer"}`}
    >
      <div className="ip-container ip-footer-inner">
        <span className="ip-faint ip-footer-copy">
          © {new Date().getFullYear()} RQ Plus
        </span>
        <nav className="ip-footer-links" aria-label="Legal and contact">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="ip-nav-link ip-footer-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ip-footer-theme">
          <ThemeToggle compact />
        </div>
      </div>
    </footer>
  );
}
