"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Spotlight card, a cursor-following radial glow + reactive border
 * (Aceternity "Card Spotlight" pattern), tuned for the light X Movement
 * surface. Pointer events drive CSS variables; no extra deps.
 */
export function SpotlightCard({
  children,
  className,
  color = "rgb(var(--accent-glow) / 0.16)",
  theme,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  theme?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      data-theme={theme}
      className={cn("spotcard", className)}
      style={{ ["--spot" as string]: color } as React.CSSProperties}
    >
      <span className="spotcard__glow" aria-hidden />
      <div className="spotcard__content">{children}</div>
    </div>
  );
}
