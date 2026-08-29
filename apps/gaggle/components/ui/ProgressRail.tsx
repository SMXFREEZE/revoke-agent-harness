"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed left-edge rail that fills with scroll progress and adopts the accent
 * color of whichever themed section is currently in view — the thread that
 * ties the multi-color "atlas" together.
 */
export function ProgressRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
        if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // adopt the accent of the themed section nearest the viewport middle
    const themed = Array.from(
      document.querySelectorAll<HTMLElement>("[data-theme]")
    ).filter((el) => el.offsetParent !== null && el.dataset.rail !== "off");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && railRef.current) {
            const accent = getComputedStyle(e.target as HTMLElement)
              .getPropertyValue("--accent")
              .trim();
            if (accent) railRef.current.style.setProperty("--rail", accent);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    themed.forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="progress-rail" ref={railRef} aria-hidden>
      <div className="progress-rail__fill" ref={fillRef} />
    </div>
  );
}
