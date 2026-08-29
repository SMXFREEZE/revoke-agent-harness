"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "sun" | "ghost" | "white" | "accent";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}

/** Premium magnetic button. Internal hrefs route through next/link; external
 *  (http) hrefs open in a new tab; otherwise it renders a <button>. */
export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  ariaLabel,
  type = "button",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 26);
    y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * 26);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const cls = cn("btn", `btn--${variant}`, size === "lg" && "btn--lg", className);
  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className="btn__arrow" aria-hidden>
          →
        </span>
      )}
    </>
  );

  const isExternal = !!href && /^https?:\/\//.test(href);

  let control: ReactNode;
  if (href && isExternal) {
    control = (
      <a href={href} className={cls} aria-label={ariaLabel} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  } else if (href) {
    control = (
      <Link href={href} className={cls} aria-label={ariaLabel} onClick={onClick}>
        {inner}
      </Link>
    );
  } else {
    control = (
      <button type={type} onClick={onClick} className={cls} aria-label={ariaLabel}>
        {inner}
      </button>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: "inline-flex" }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {control}
    </motion.div>
  );
}
