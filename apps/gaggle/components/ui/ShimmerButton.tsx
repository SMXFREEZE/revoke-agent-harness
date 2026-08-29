"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Shimmer button, a solid pill with a diagonal shine that sweeps across
 * (Aceternity "Shimmer" pattern). Crisp and premium; no soft drop-shadow halo.
 */
export function ShimmerButton({
  children,
  href,
  external,
  onClick,
  variant = "sun",
  size = "md",
  type = "button",
  className,
}: {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  variant?: "sun" | "violet" | "ink";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = cn("shb", `shb--${variant}`, `shb--${size}`, className);
  const inner = (
    <>
      <span className="shb__shine" aria-hidden />
      <span className="shb__label">{children}</span>
    </>
  );

  if (href && /^https?:\/\//.test(href)) {
    return (
      <a className={cls} href={href} onClick={onClick} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link className={cls} href={href} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
