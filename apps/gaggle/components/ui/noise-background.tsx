"use client";
import { cn } from "@/lib/utils/cn";
import type { ReactNode, CSSProperties } from "react";

/**
 * NoiseBackground (after Aceternity's noise-background) — an animated gradient
 * ring with a subtle noise grain, used as a premium border behind a pill.
 */
export function NoiseBackground({
  children,
  className,
  containerClassName,
  gradientColors = ["#15aeea", "#73cef2", "#ffce3a"],
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  gradientColors?: string[];
}) {
  const stops = [...gradientColors, gradientColors[0]].join(", ");
  // colours flow via a CSS var so the ring's rotation can be driven by an animated
  // @property angle (transform-free) — that keeps the gradient border clipped to the
  // pill's rounded corners on every engine, incl. iOS Safari.
  return (
    <div className={cn("nb", containerClassName)} style={{ ["--nb-stops"]: stops } as CSSProperties}>
      <span className="nb__grad" aria-hidden />
      <span className="nb__noise" aria-hidden />
      <div className={cn("nb__inner", className)}>{children}</div>
    </div>
  );
}
