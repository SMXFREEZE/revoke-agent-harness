"use client";

import { Fragment, useEffect, useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * One crafted split-text reveal for every heading: words sit in masks and
 * rise on scroll-in with a soft stagger (Reasonal/WonderMakers feel).
 * Spaces are emitted as text nodes BETWEEN masks so words never run together.
 */
export function SplitHeading({
  text,
  as: Tag = "h2",
  className,
  stagger = 0.06,
  start = "top 85%",
}: {
  text: string;
  as?: ElementType;
  className?: string;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const lines = text.split("\n");

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const words = el.querySelectorAll<HTMLElement>(".sh-word");
    const ctx = gsap.context(() => {
      gsap.set(words, { yPercent: 115 });
      gsap.to(words, {
        yPercent: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced, stagger, start]);

  const Comp: any = Tag; // polymorphic tag, cast so it accepts ref + children
  return (
    <Comp ref={ref} className={cn(className)} data-split>
      {lines.map((line, li) => (
        <span className="sh-line" key={li}>
          {line.split(" ").map((word, wi, arr) => (
            <Fragment key={wi}>
              <span className="sh-mask">
                <span className="sh-word">{word}</span>
              </span>
              {wi < arr.length - 1 ? " " : ""}
            </Fragment>
          ))}
          {li < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </Comp>
  );
}
