"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

export default function AuthWelcomePage() {
  return (
    <AuthShell>
      <div className="ip-auth-card ip-auth-card-center">
        <p className="ip-mono ip-badge ip-badge-success" style={{ marginBottom: 16 }}>
          Email confirmed
        </p>
        <h1 className="ip-display" style={{ fontSize: "1.6rem", margin: "0 0 0.75rem" }}>
          You are in
        </h1>
        <BalancedText
          className="ip-muted ip-text-block"
          style={{ margin: "0 0 1.5rem", maxWidth: 340, lineHeight: 1.55 }}
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
