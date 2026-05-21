import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const variantClass: Record<Variant, string> = {
  primary: "ip-btn ip-btn-primary",
  secondary: "ip-btn ip-btn-secondary",
  ghost: "ip-btn ip-btn-ghost",
  danger: "ip-btn ip-btn-danger",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & {
  href: string;
  external?: boolean;
};

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", children, className = "" } = props;
  const cls = `${variantClass[variant]}${size === "sm" ? " ip-btn-sm" : ""} ${className}`.trim();

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  const {
    type = "button",
    variant: _v,
    size: _s,
    children: _c,
    className: _cl,
    ...rest
  } = props as ButtonProps;
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
