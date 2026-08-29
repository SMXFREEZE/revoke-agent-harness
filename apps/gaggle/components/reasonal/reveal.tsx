"use client";

import { Fragment, useEffect, useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Word-rise reveal (Reasonal `.feat-word`): words rise + de-blur, staggered. */
export function RWordReveal({
  text,
  as: Tag = "h2",
  className = "",
  body = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  body?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const words = el.querySelectorAll<HTMLElement>(".rz-word");
    const ctx = gsap.context(() => {
      gsap.set(words, { opacity: 0, y: body ? 12 : 20, filter: "blur(8px)" });
      gsap.to(words, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: body ? 0.4 : 0.5,
        ease: "power3.out",
        stagger: body ? 0.02 : 0.04,
        scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced, body]);

  const lines = text.split("\n");
  // dynamic element type: cast to any so the polymorphic tag accepts ref + children
  const Comp: any = Tag;
  return (
    <Comp ref={ref} className={className}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.split(" ").map((w, wi, arr) => (
            <Fragment key={wi}>
              <span className={`rz-word${body ? " rz-word--body" : ""}`}>{w}</span>
              {wi < arr.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </span>
      ))}
    </Comp>
  );
}

/** Char-brighten reveal (Reasonal manifesto): chars go 0.14 → 1, scrubbed. */
export function RCharReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const chars = el.querySelectorAll<HTMLElement>(".rz-char");
    const ctx = gsap.context(() => {
      gsap.set(chars, { opacity: 0.14 });
      gsap.to(chars, {
        opacity: 1,
        ease: "none",
        stagger: 0.02,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  // split into words (keep them unbreakable) then chars
  return (
    <p ref={ref} className={className}>
      {text.split(" ").map((word, wi, arr) => (
        <Fragment key={wi}>
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((c, ci) => (
              <span key={ci} className="rz-char">
                {c}
              </span>
            ))}
          </span>
          {wi < arr.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </p>
  );
}
