"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const footerLinks = [
  { href: "/terms", label: "Legal" },
  { href: "/privacy", label: "Privacy" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="ip-footer ip-marketing-footer">
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
