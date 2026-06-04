"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { RqPlusMark } from "@/components/brand/RqPlusMark";
import { Button } from "@/components/ui/Button";

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="ip-nav">
      <div className="ip-container ip-nav-inner">
        <Link href="/" className="ip-logo">
          <RqPlusMark />
          RQ Plus
        </Link>

        <div
          className={`ip-nav-links${open ? " ip-nav-links-open" : ""}`}
          id="marketing-nav-links"
        >
          <Link href="/gallery" className="ip-nav-link" onClick={() => setOpen(false)}>
            Gallery
          </Link>
          <Link href="/pricing" className="ip-nav-link" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <Link href="/scan" className="ip-nav-link" onClick={() => setOpen(false)}>
            Scan
          </Link>
          <Link href="/login" className="ip-nav-link" onClick={() => setOpen(false)}>
            Log in
          </Link>
          <ThemeToggle />
          <Button href="/login" size="sm">
            Get started
          </Button>
        </div>

        <button
          type="button"
          className="ip-mobile-menu ip-btn ip-btn-ghost ip-btn-sm"
          aria-expanded={open}
          aria-controls="marketing-nav-links"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
      </div>
    </nav>
  );
}
