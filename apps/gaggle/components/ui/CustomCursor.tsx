"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Glassy custom cursor: a ~40px frosted-glass RING with a rim-lit gradient edge,
 * a small precise green-glow center dot, and a soft brand-green shimmer that lags
 * behind. Desktop pointer only; on touch / coarse pointers nothing animates and
 * the native cursor stays.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const shimmer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const d = dot.current;
    const r = ring.current;
    const s = shimmer.current;
    if (!d || !r) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasGsap = !!gsap && typeof gsap.quickTo === "function";

    document.documentElement.classList.add("has-cursor");

    const makeSetter = (
      el: HTMLElement,
      axis: "x" | "y",
      duration: number
    ): ((v: number) => void) => {
      if (hasGsap) {
        gsap.set(el, { xPercent: -50, yPercent: -50 });
        return gsap.quickTo(el, axis, {
          duration: reduce ? Math.min(duration, 0.12) : duration,
          ease: "power3",
        });
      }
      const pos = { x: 0, y: 0 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).__pos = pos;
      return (v: number) => {
        pos[axis] = v;
        el.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`;
      };
    };

    const dx = makeSetter(d, "x", 0.1);
    const dy = makeSetter(d, "y", 0.1);
    const rx = makeSetter(r, "x", 0.42);
    const ry = makeSetter(r, "y", 0.42);
    const sx = s ? makeSetter(s, "x", 0.9) : null;
    const sy = s ? makeSetter(s, "y", 0.9) : null;

    const interactive = (t: EventTarget | null) =>
      t instanceof Element &&
      t.closest("a, button, [data-cursor], input, textarea, select, summary, [role='button']");

    const move = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      dx(x);
      dy(y);
      rx(x);
      ry(y);
      if (sx && sy) {
        sx(x);
        sy(y);
      }
    };
    const over = (e: PointerEvent) => {
      if (interactive(e.target)) r.classList.add("is-hover");
    };
    const out = (e: PointerEvent) => {
      if (interactive(e.target)) r.classList.remove("is-hover");
    };
    const down = () => r.classList.add("is-down");
    const up = () => r.classList.remove("is-down");
    const enter = () => r.classList.remove("is-gone");
    const leave = () => r.classList.add("is-gone");

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerenter", enter);
    document.addEventListener("pointerleave", leave);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerenter", enter);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div ref={shimmer} className="cursor-shimmer" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span className="cursor-ring__rim" />
        <span className="cursor-ring__spec" />
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden>
        <svg className="cursor-logo" viewBox="0 0 1024 1024" focusable="false">
          <defs>
            <linearGradient id="xm-cursor-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f6fcff" />
              <stop offset="0.5" stopColor="#bfe3f7" />
              <stop offset="1" stopColor="#73cef2" />
            </linearGradient>
          </defs>
          <g transform="translate(79.995 78.512) scale(0.658188)">
            <path
              fillRule="evenodd"
              fill="url(#xm-cursor-glass)"
              d="M 274 25.065 C 226.911 28.103, 176.074 45.790, 139.500 71.862 C 76.456 116.804, 37.799 179.761, 26.435 256 C 23.918 272.886, 24.213 312.667, 26.987 330.500 C 32.512 366.019, 44.712 400.010, 62.543 429.567 C 78.493 456.006, 84.509 462.711, 162.076 540.500 C 201.015 579.550, 233.740 612.625, 234.799 614 C 242.740 624.314, 247.124 637.600, 247.174 651.500 C 247.232 667.756, 242.961 680.061, 232.944 692.497 C 230.284 695.798, 197.430 729.100, 159.934 766.500 C 121.696 804.641, 88.218 838.891, 83.693 844.500 C 62.152 871.199, 44.665 904.579, 35.232 937 C 27.087 964.997, 24.849 981.385, 24.854 1013 C 24.857 1033.068, 25.247 1040.033, 27.011 1051.500 C 49.357 1196.771, 181.690 1296.480, 327 1277.531 C 366.902 1272.327, 409.376 1256.025, 442.500 1233.200 C 460.870 1220.542, 471.307 1210.820, 540.500 1141.914 C 586.988 1095.619, 614.449 1069, 618 1066.791 C 629.440 1059.673, 638.584 1056.958, 651.482 1056.851 C 665.302 1056.737, 677.106 1060.286, 688.687 1068.040 C 691.334 1069.812, 722.771 1100.565, 758.546 1136.381 C 841.968 1219.895, 841.045 1219.036, 863.853 1234.440 C 924.561 1275.442, 1002.570 1289.788, 1073 1272.904 C 1150.937 1254.220, 1214.057 1205.098, 1250.331 1134.897 C 1282.964 1071.744, 1288.790 997.617, 1266.483 929.396 C 1259.864 909.154, 1248.968 886.240, 1237.502 868.452 C 1223.657 846.973, 1219.094 841.997, 1144.452 767 C 1104.218 726.575, 1069.943 691.475, 1068.284 689 C 1059.928 676.529, 1056.771 666.217, 1056.804 651.500 C 1056.821 644.071, 1057.388 639.700, 1059.011 634.500 C 1063.971 618.606, 1061.543 621.362, 1140.483 542 C 1180.693 501.575, 1216.107 465.350, 1219.181 461.500 C 1250.543 422.226, 1269.199 380.068, 1277.153 330.500 C 1280.415 310.173, 1280.398 273.853, 1277.118 253 C 1269.488 204.507, 1249.666 159.592, 1219.525 122.500 C 1209.181 109.771, 1187.519 88.998, 1174 78.844 C 1142.772 55.389, 1108.057 39.364, 1070.500 31.066 C 1048.085 26.114, 1041.537 25.496, 1012 25.549 C 988.738 25.591, 982.496 25.929, 971.500 27.745 C 923.529 35.667, 880.394 55.104, 842.500 85.874 C 838.100 89.446, 801.875 124.858, 762 164.566 C 689.500 236.762, 689.500 236.762, 681 240.791 C 658.914 251.258, 636.847 249.996, 617.115 237.135 C 614.019 235.118, 581.609 203.556, 540.889 162.903 C 501.491 123.570, 465.628 88.625, 460.089 84.169 C 407.394 41.783, 341.127 20.736, 274 25.065 M 434.609 435.082 C 436.319 436.962, 440.865 442.550, 444.711 447.500 C 483.674 497.648, 507.382 556.476, 514.029 619.500 C 515.393 632.437, 515.387 671.643, 514.019 684.500 C 507 750.462, 480.662 813.633, 439.596 863 C 432.067 872.051, 432.412 871.998, 444.399 862.273 C 455.475 853.286, 466.747 845.448, 481 836.822 C 519.703 813.398, 558.713 799.430, 605.385 792.281 C 620.943 789.898, 625.274 789.655, 653 789.605 C 684.651 789.549, 694.938 790.483, 719 795.602 C 773.058 807.100, 826.742 833.214, 866 867.108 L 874.500 874.446 868.662 867.473 C 845.353 839.633, 827.531 810.556, 815.046 780 C 812.687 774.225, 810.388 768.600, 809.939 767.500 C 804.991 755.386, 797.222 726.882, 794.541 711 C 793.659 705.775, 792.502 699.065, 791.970 696.089 C 788.643 677.483, 788.453 636.458, 791.581 612.141 C 799.937 547.167, 827.435 484.216, 867.411 438.543 C 874.240 430.740, 873.486 430.831, 864 438.951 C 828.298 469.514, 778.050 494.566, 729 506.257 C 705.484 511.863, 694.041 513.517, 670 514.787 C 625.434 517.141, 582.829 510.974, 540.788 496.083 C 504.477 483.223, 471.028 464.163, 440 438.653 C 435.325 434.809, 432.899 433.202, 434.609 435.082"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
