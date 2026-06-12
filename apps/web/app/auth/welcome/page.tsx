"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { BalancedText } from "@/components/ui/BalancedText";

export default function AuthWelcomePage() {
  return (
    <AuthShell>
      <div className="ip-auth-card ip-auth-card-center ip-auth-card-portal ip-auth-card-welcome">
        <p className="ip-mono ip-badge ip-badge-success ip-auth-badge-lg ip-auth-badge-caps">
          EMAIL CONFIRMED
        </p>
        <h1 className="ip-display ip-auth-title ip-auth-title-caps">YOU ARE IN</h1>
        <BalancedText
          className="ip-muted ip-text-block ip-copy-sm ip-card-spaced-lg"
          lines={[
            "Create a portal, attach a destination,",
            "& share a visual viewers scan at rub.pub/scan.",
          ]}
        />
        <Link href="/dashboard" className="ip-btn ip-btn-primary">
          DASHBOARD
        </Link>
      </div>
    </AuthShell>
  );
}
