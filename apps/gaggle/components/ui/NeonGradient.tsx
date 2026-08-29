"use client";

import { useEffect, useRef } from "react";

/**
 * Flowing neon mesh-gradient background, powered by granim.js
 * (https://github.com/sarcadass/granim.js, MIT). The library is loaded
 * client-side and animates between saturated violet / cyan / lime / magenta /
 * sun states. Paused when off-screen; destroyed on unmount.
 */
export function NeonGradient({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let instance: { destroy?: () => void } | null = null;
    let cancelled = false;

    import("granim").then((mod) => {
      if (cancelled || !ref.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Granim = (mod.default ?? mod) as any;
      instance = new Granim({
        element: ref.current,
        direction: "diagonal",
        isPausedWhenNotInView: true,
        states: {
          "default-state": {
            gradients: [
              ["#6a00f4", "#b14bff"],
              ["#ff3fae", "#7c3cff"],
              ["#9a1cff", "#ff5fc8"],
              ["#5b0fd6", "#c44bff"],
              ["#7c1cff", "#ff4db5"],
            ],
            transitionSpeed: 4500,
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        instance?.destroy?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
