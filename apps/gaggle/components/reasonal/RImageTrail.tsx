"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DISCIPLINES } from "@/lib/data/site";
import { RWordReveal } from "./reveal";

// pool of photos that trail the cursor (Codrops "Image Trail" technique)
const IMAGES = [
  "/img/gut-water.jpg",
  ...DISCIPLINES.filter((d) => d.id !== "more").map((d) => d.art),
  "/images/tulum/feat-mentor.jpg",
  "/images/tulum/feat-community.jpg",
];

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x1 - x2, y1 - y2);

export function RImageTrail() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const imgs = Array.from(wrap.querySelectorAll<HTMLElement>(".rz-trail__img"));
    const total = imgs.length;
    let idx = 0;
    let z = 1;
    const mouse = { x: 0, y: 0 };
    const last = { x: 0, y: 0 };
    const cache = { x: 0, y: 0 };
    let started = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      if (!started) {
        last.x = mouse.x;
        last.y = mouse.y;
        cache.x = mouse.x;
        cache.y = mouse.y;
        started = true;
      }
    };
    wrap.addEventListener("pointermove", onMove);

    const showNext = () => {
      const el = imgs[idx];
      idx = idx < total - 1 ? idx + 1 : 0;
      z++;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      gsap.killTweensOf(el);
      gsap
        .timeline()
        .set(el, {
          startAt: { opacity: 0, scale: 0.7 },
          opacity: 1,
          scale: 1,
          zIndex: z,
          x: cache.x - w / 2,
          y: cache.y - h / 2,
          rotate: gsap.utils.random(-12, 12),
        })
        .to(el, {
          duration: 0.9,
          ease: "expo.out",
          x: mouse.x - w / 2,
          y: mouse.y - h / 2,
        })
        .to(el, { duration: 1, ease: "power1.out", opacity: 0 }, 0.45)
        .to(el, { duration: 1, ease: "power4.out", scale: 0.25 }, 0.45);
    };

    const threshold = 60;
    const render = () => {
      if (started) {
        const d = dist(mouse.x, mouse.y, last.x, last.y);
        cache.x = lerp(cache.x, mouse.x, 0.35);
        cache.y = lerp(cache.y, mouse.y, 0.35);
        if (d > threshold) {
          showNext();
          last.x = mouse.x;
          last.y = mouse.y;
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      gsap.killTweensOf(imgs);
    };
  }, []);

  return (
    <section className="rz-sec" id="explore">
      <div className="rz-card-w">
        <div className="rz-trail" ref={wrapRef}>
          <div className="rz-trail__copy">
            <span className="rz-eyebrow">Evidence, made inspectable</span>
            <RWordReveal as="h2" className="rz-h2" text="Move your cursor. Follow the provenance." />
            <p className="rz-body-text">Sources, experiments, candidate revisions, and dissent remain attached to the verdict.</p>
          </div>

          {/* static fallback collage (shown when the trail can't run) */}
          <div className="rz-trail__fallback" aria-hidden>
            {IMAGES.slice(0, 6).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>

          {/* trail pool */}
          {IMAGES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="rz-trail__img" aria-hidden />
          ))}
        </div>
      </div>
    </section>
  );
}
