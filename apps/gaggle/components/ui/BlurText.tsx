"use client";

import { useEffect, useRef, createElement, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

/**
 * Blur-on-scroll text reveal, ported from Codrops' "ScrollBlurTypography" demo
 * (https://github.com/codrops/ScrollBlurTypography, MIT © Codrops). Each
 * character animates from blurred + dark to sharp, scrubbed to scroll position.
 * The gsap.fromTo animation below is kept verbatim from the original effect.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function BlurText({
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

    const split = new SplitType(el, { types: "words,chars" });
    const chars = split.chars;

    const tween = gsap.fromTo(
      chars,
      {
        filter: "blur(10px) brightness(0%)",
        willChange: "filter",
      },
      {
        ease: "none",
        filter: "blur(0px) brightness(100%)",
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          start: "top bottom-=15%",
          end: "bottom center+=15%",
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      split.revert();
    };
  }, [text]);

  return createElement(as, { ref, className }, text);
}
