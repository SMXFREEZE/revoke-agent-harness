"use client";

import { useEffect, useRef, createElement, type ElementType, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/**
 * Scramble-on-scroll text effect, ported from Codrops' "ScrollTextMotion" demo
 * (https://github.com/codrops/ScrollTextMotion, MIT © Codrops). Text decodes
 * from random characters into place each time it scrolls into view, using GSAP's
 * ScrambleTextPlugin. Falls back to plain text under reduced-motion.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
}

export function ScrambleText({
  text,
  as = "span",
  className,
  style,
  duration = 1.1,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  duration?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const run = () => {
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { scrambleText: { text: "", chars: "" } },
        { scrambleText: { text, chars: "upperAndLowerCase", revealDelay: 0 }, duration, ease: "none" },
      );
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      end: "bottom top",
      onEnter: run,
      onEnterBack: run,
    });
    return () => st.kill();
  }, [text, duration]);

  return createElement(as, { ref, className, style }, text);
}
