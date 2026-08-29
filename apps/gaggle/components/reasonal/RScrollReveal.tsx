"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal for [data-reveal] images. Robust by design: elements are
 * VISIBLE by default; this arms them (hides) only when JS runs, reveals
 * anything already in view immediately, observes the rest, and a safety
 * timer guarantees nothing ever stays hidden if the observer misfires.
 */
export function RScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;

    const reveal = (el: HTMLElement) => el.classList.add("is-in");
    els.forEach((el) => el.classList.add("reveal-armed"));

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target as HTMLElement);
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    els.forEach((el) => {
      // reveal immediately if already in (or near) the viewport
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) reveal(el);
      else io.observe(el);
    });

    // safety net: never leave anything hidden
    const safety = window.setTimeout(() => els.forEach(reveal), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return null;
}
