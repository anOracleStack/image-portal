"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

export default function AuthWelcomePage() {
  return (
    <AuthShell>
      <div className="ip-auth-card ip-auth-card-center">
        <p className="ip-mono ip-badge ip-badge-success ip-auth-badge-lg">
          Email confirmed
        </p>
        <h1 className="ip-display ip-auth-title">You are in</h1>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-sm ip-card-spaced-lg"
          lines={[
            "Create your first visual portal",
            "& start linking camera scans",
            "to destinations.",
          ]}
        />
        <Link href="/dashboard" className="ip-btn ip-btn-primary">
          Go to dashboard
        </Link>
      </div>
    </AuthShell>
  );
}
