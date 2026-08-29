"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/**
 * Infinite ticker whose speed + direction react to scroll velocity — it surges
 * and flips as you scroll (the slush.app marquee feel). Pure framer-motion.
 */
export function Marquee({
  items,
  className,
  sep = "✦",
  baseVelocity = 1.4,
}: {
  items: string[];
  className?: string;
  sep?: string;
  baseVelocity?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    let moveBy = dir.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) dir.current = -1;
    else if (vf > 0) dir.current = 1;
    moveBy += dir.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  const block = (key: string) => (
    <span key={key} className="marquee__block">
      {items.map((it, i) => (
        <span key={i}>
          {it}
          <span aria-hidden className="marquee__sep">
            {sep}
          </span>
        </span>
      ))}
    </span>
  );

  // Decorative ticker — hidden from assistive tech (content lives in the cards).
  if (reduced) {
    return (
      <div className={cn("marquee marquee--reactive marquee--static", className)} aria-hidden>
        <div className="marquee__track">{block("a")}</div>
      </div>
    );
  }

  return (
    <div className={cn("marquee marquee--reactive", className)} aria-hidden>
      <motion.div className="marquee__track" style={{ x }}>
        {block("a")}
        {block("b")}
        {block("c")}
        {block("d")}
      </motion.div>
    </div>
  );
}
