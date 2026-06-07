import Link from "next/link";
import { GlowBackground } from "@/components/ui/GlowBackground";
import { HelpChat } from "@/components/HelpChat";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ip-page">
      <GlowBackground showGrid={false} />
      <div className="ip-auth-toolbar">
        <ThemeToggle />
        <Link href="/" className="ip-nav-link">
          Home
        </Link>
      </div>
      <div className="ip-auth-page">{children}</div>
      <HelpChat />
    </div>
  );
}
