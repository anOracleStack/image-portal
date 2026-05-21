import Link from "next/link";
import { GlowBackground } from "@/components/ui/GlowBackground";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ip-page">
      <GlowBackground showGrid={false} />
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <ThemeToggle />
        <Link href="/" className="ip-nav-link">
          Home
        </Link>
      </div>
      <div className="ip-auth-page">{children}</div>
    </div>
  );
}
