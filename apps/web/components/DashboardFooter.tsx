"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { HelpChat, HelpChatFooterToggle } from "@/components/HelpChat";

export function DashboardFooter() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <footer className="ip-dash-footer ip-dash-footer-fixed">
      <HelpChat embedded open={helpOpen} onOpenChange={setHelpOpen} />
      <div className="ip-container ip-footer-inner ip-dash-footer-inner">
        <span className="ip-faint ip-footer-copy ip-dash-footer-copy">
          © {new Date().getFullYear()} RQ Plus
        </span>
        <div className="ip-dash-footer-center">
          <HelpChatFooterToggle
            open={helpOpen}
            onToggle={() => setHelpOpen((v) => !v)}
          />
          <div className="ip-dash-footer-theme">
            <ThemeToggle />
          </div>
        </div>
        <Link href="/" className="ip-nav-link ip-copy-sm ip-dash-footer-home">
          Home
        </Link>
      </div>
    </footer>
  );
}
