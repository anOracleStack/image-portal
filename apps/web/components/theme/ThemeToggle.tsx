"use client";

import { useTheme } from "./ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const options: { id: ThemePreference; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "system", label: "Auto" },
];

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="ip-theme-toggle"
      role="group"
      aria-label="Color theme"
      title="Appearance: dark, light, or match system"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className="ip-theme-option"
          data-active={preference === opt.id ? "true" : "false"}
          onClick={() => setPreference(opt.id)}
          aria-pressed={preference === opt.id}
        >
          {compact ? opt.label.slice(0, 1) : opt.label}
        </button>
      ))}
    </div>
  );
}
