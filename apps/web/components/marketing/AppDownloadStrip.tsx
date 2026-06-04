"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BalancedText } from "@/components/ui/BalancedText";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AppDownloadStrip() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      return;
    }
    window.location.href = "/scan";
  }

  return (
    <div className="ip-app-download ip-animate-in ip-animate-in-delay-2">
      <BalancedText
        className="ip-muted ip-text-block ip-app-download-copy"
        lines={[
          "Use RQ Plus in your browser —",
          "or install it as a standalone app.",
        ]}
      />
      <div className="ip-app-download-actions">
        <Button href="/scan" variant="secondary" className="ip-btn-hero">
          Open web app
        </Button>
        {installed ? (
          <span className="ip-app-download-installed ip-mono">App installed</span>
        ) : (
          <Button type="button" variant="primary" className="ip-btn-hero" onClick={handleInstall}>
            {deferred ? "Install app" : "Get the app"}
          </Button>
        )}
      </div>
      {!deferred && !installed ? (
        <BalancedText
          className="ip-faint ip-mono ip-app-download-hint ip-text-block"
          lines={["iPhone & iPad: Share →", "Add to Home Screen"]}
        />
      ) : null}
    </div>
  );
}
