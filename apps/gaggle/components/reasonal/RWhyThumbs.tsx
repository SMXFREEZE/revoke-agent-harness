"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { publicAssetPath } from "@/lib/utils/base-path";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Floating discipline photos around the manifesto. `depth` drives the scroll
 *  parallax speed; `dur` the gentle idle float. */
const THUMBS = [
  { src: publicAssetPath("img/gut-veg.jpg"), depth: 0.9, dur: 6.5, style: { left: "4%", top: "12%", width: "150px", height: "150px" } },
  { src: publicAssetPath("img/gut-fruit.jpg"), depth: 0.45, dur: 7.5, style: { right: "5%", top: "9%", width: "130px", height: "180px" } },
  { src: publicAssetPath("img/gut-culture.jpg"), depth: 1, dur: 8, style: { left: "10%", bottom: "10%", width: "140px", height: "120px" } },
  { src: publicAssetPath("img/gut-lab.jpg"), depth: 0.7, dur: 6, style: { right: "8%", bottom: "12%", width: "150px", height: "150px" } },
  { src: publicAssetPath("img/gut-fermented.jpg"), depth: 0.4, dur: 9, style: { left: "1%", top: "46%", width: "110px", height: "110px" } },
  { src: publicAssetPath("images/tulum/feat-community.jpg"), depth: 0.85, dur: 7, style: { right: "1%", top: "44%", width: "120px", height: "150px" } },
];

export function RWhyThumbs() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrap.current;
    if (!el || !gsap || typeof gsap.context !== "function") return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".rz-why__thumb");
      items.forEach((it, i) => {
        const depth = Number(it.dataset.depth || 0.6);
        const dur = Number(it.dataset.dur || 7);
        // staggered reveal in
        gsap.fromTo(
          it,
          { autoAlpha: 0, scale: 0.82 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            delay: i * 0.07,
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          },
        );
        // gentle continuous float
        gsap.to(it, { y: -10, duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true, delay: i * 0.3 });
        // scroll parallax (combines with the float's y via yPercent)
        gsap.to(it, {
          yPercent: -depth * 36,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="rz-why__thumbs" ref={wrap} aria-hidden>
      {THUMBS.map((t, i) => (
        <div
          className="rz-why__thumb"
          key={i}
          data-depth={t.depth}
          data-dur={t.dur}
          style={t.style as React.CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.src} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  );
}
