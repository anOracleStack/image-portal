import type { CSSProperties, ElementType } from "react";

type BalancedTextProps = {
  /** Pre-balanced lines; use "," at line end before a line that starts with "&". */
  lines: readonly string[];
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
};

/**
 * Renders copy as fixed-width, center-aligned lines for even visual rhythm.
 */
export function BalancedText({
  lines,
  className = "ip-text-block",
  style,
  as: Tag = "p",
}: BalancedTextProps) {
  return (
    <Tag className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} className="ip-text-block-line">
          {line}
        </span>
      ))}
    </Tag>
  );
}
