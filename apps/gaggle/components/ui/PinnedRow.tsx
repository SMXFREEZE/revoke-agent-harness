"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Pinned horizontal-scroll gallery (original implementation). On desktop the
 * section pins and its track slides sideways as you scroll down — the classic
 * award-site horizontal gallery. On mobile / reduced-motion it falls back to a
 * native swipe-scroll row.
 */
export function PinnedRow({ children, className }: { children: ReactNode; className?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(max-width: 980px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={sectionRef} className={`pinrow ${className ?? ""}`}>
      <div ref={trackRef} className="pinrow__track">
        {children}
      </div>
    </div>
  );
}
