"use client";

import { useEffect, useRef, createElement, type ElementType } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Wraps Codrops' OnScrollTextHighlight effect-1 (per-character 3D reveal on
 * scroll). Splitting.js + the verbatim HighlightEffect class are loaded
 * client-side only (Splitting touches `document` on import). Skipped under
 * reduced-motion.
 */
export function HighlightText({
  text,
  as = "span",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    Promise.all([import("splitting"), import("@/components/vendor/highlightEffect")]).then(
      ([splittingMod, fxMod]) => {
        if (!active || !ref.current) return;
        const Splitting = splittingMod.default;
        Splitting({ target: el, by: "chars" });
        new fxMod.HighlightEffect(el);
      },
    );

    return () => {
      active = false;
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [text]);

  return createElement(as, { ref, className: className ? `hx ${className}` : "hx" }, text);
}
