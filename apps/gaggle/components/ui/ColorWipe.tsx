"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Beaucoup-style "develop" reveal: the child sits under a solid accent
 * overlay that wipes away (opacity 1→0) when it scrolls into view, so each
 * card emerges out of its own color. Inherits --accent from its data-theme.
 */
export function ColorWipe({
  children,
  className,
  delay = 0,
  theme,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  theme?: string;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.setProperty("--wipe-delay", `${delay}ms`);
            el.classList.add("is-revealed");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as never} className={cn("color-wipe", className)} data-theme={theme}>
      {children}
    </Tag>
  );
}
