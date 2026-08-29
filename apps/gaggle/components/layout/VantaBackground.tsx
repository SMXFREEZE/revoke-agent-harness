"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

interface VantaInstance {
  destroy: () => void;
  resize?: () => void;
}

type Effect = "clouds" | "fog";

interface VantaBackgroundProps {
  effect: Effect;
  className?: string;
  options?: Record<string, number | boolean>;
}

/**
 * Animated WebGL backdrop powered by Vanta.js (MIT). Loads in the browser only,
 * is skipped under reduced motion, and fails silently to whatever sits behind it.
 */
export function VantaBackground({ effect, className, options = {} }: VantaBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const instance = useRef<VantaInstance | null>(null);
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced || !ref.current) return;
    // Phones keep the static sky-gradient fallback behind this div — one less
    // live WebGL context, so the hero stays smooth on mobile.
    if (window.matchMedia("(max-width: 768px)").matches) return;
    let active = true;
    let ro: ResizeObserver | null = null;

    const load =
      effect === "clouds"
        ? import("vanta/dist/vanta.clouds.min")
        : import("vanta/dist/vanta.fog.min");

    load
      .then((mod) => {
        if (!active || !ref.current) return;
        const factory = (mod as { default: (o: Record<string, unknown>) => VantaInstance }).default;
        try {
          instance.current = factory({
            el: ref.current,
            THREE,
            mouseControls: false,
            touchControls: false,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            ...options,
          });
          // fade the canvas in once painted, so it never pops in late
          requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
          // keep the canvas covering the container as it grows (e.g. the report
          // panel expanding after a run), so the fog always fills the whole panel
          if (typeof ResizeObserver !== "undefined" && ref.current) {
            ro = new ResizeObserver(() => instance.current?.resize?.());
            ro.observe(ref.current);
          }
        } catch {
          /* leave the static background in place */
        }
      })
      .catch(() => {});

    // safety: always reveal even if init is slow or the rAF path is missed,
    // so the background can never get stuck hidden by the fade-in gate
    const safety = setTimeout(() => { if (active) setReady(true); }, 1500);

    return () => {
      active = false;
      clearTimeout(safety);
      ro?.disconnect();
      instance.current?.destroy();
      instance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, effect]);

  return <div ref={ref} className={cn("vanta", ready && "is-ready", className)} aria-hidden />;
}
