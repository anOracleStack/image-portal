import { GlowBackground } from "@/components/ui/GlowBackground";
import { HelpChat } from "@/components/HelpChat";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";

export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="ip-page">
      <GlowBackground />
      <MarketingNav />
      <div className="ip-main-content">{children}</div>
      <MarketingFooter />
      <HelpChat />
    </div>
  );
}
