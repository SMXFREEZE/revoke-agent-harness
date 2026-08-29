"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Moving-border button, a gradient that travels around the pill border
 * (Aceternity "Moving Border" pattern), implemented with an animated
 * conic-gradient. Premium, no soft glow-halo. Internal hrefs route via
 * next/link, external open in a new tab, otherwise a <button>.
 */
export function MovingButton({
  children,
  href,
  external,
  onClick,
  size = "md",
  className,
}: {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const inner = (
    <span className={cn("mvb", `mvb--${size}`, className)}>
      <span className="mvb__border" aria-hidden />
      <span className="mvb__inner">{children}</span>
    </span>
  );

  if (href && /^https?:\/\//.test(href)) {
    return (
      <a href={href} onClick={onClick} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="mvb-reset">
      {inner}
    </button>
  );
}
