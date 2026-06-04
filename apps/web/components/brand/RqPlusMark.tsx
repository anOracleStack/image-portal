type RqPlusMarkProps = {
  className?: string;
  size?: number;
};

/** Minimal RQ+ monogram with QR-grid motif — nav & favicon scale. */
export function RqPlusMark({ className = "ip-logo-mark", size = 28 }: RqPlusMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#rq-plus-bg)" />
      <path
        d="M8 8h6v6H8V8zm10 0h6v6h-6V8zM8 18h6v6H8v-6zm10 0h6v6h-6v-6z"
        fill="var(--accent-foreground)"
        opacity="0.35"
      />
      <path
        d="M10 10h2v2h-2v-2zm12 0h2v2h-2v-2zM10 20h2v2h-2v-2zm8 0h4v4h-4v-4z"
        fill="var(--accent-foreground)"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="var(--accent-foreground)"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        +
      </text>
      <defs>
        <linearGradient id="rq-plus-bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 45%, #6366f1)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
