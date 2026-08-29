"use client";

import { forwardRef, ReactNode, RefObject, useEffect, useId, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// run the measurement before paint to avoid a one-frame flash, but fall back to
// useEffect during SSR (useLayoutEffect warns on the server)
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Animated gradient beam between two elements inside a shared container (the
// magic-ui / ui-layouts pattern, rebuilt self-contained with no Tailwind deps).
// A dotted base path plus a travelling gradient stroke that loops.

export interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  dotted?: boolean;
  dotSpacing?: number;
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  pathColor = "#a4c6da",
  pathWidth = 2,
  pathOpacity = 0.65,
  gradientStartColor = "#15aeea",
  gradientStopColor = "#7c6cf0",
  delay = 0,
  duration = 4.5,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  dotted = false,
  dotSpacing = 6,
}: AnimatedBeamProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [pathD, setPathD] = useState("");
  const [dim, setDim] = useState({ width: 0, height: 0 });

  const coords = reverse
    ? { x1: ["90%", "-10%"], x2: ["100%", "0%"], y1: ["0%", "0%"], y2: ["0%", "0%"] }
    : { x1: ["10%", "110%"], x2: ["0%", "100%"], y1: ["0%", "0%"], y2: ["0%", "0%"] };

  useIsoLayoutEffect(() => {
    const update = () => {
      const c = containerRef.current, a = fromRef.current, b = toRef.current;
      if (!c || !a || !b) return;
      const cr = c.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      setDim({ width: cr.width, height: cr.height });
      const sx = ar.left - cr.left + ar.width / 2 + startXOffset;
      const sy = ar.top - cr.top + ar.height / 2 + startYOffset;
      const ex = br.left - cr.left + br.width / 2 + endXOffset;
      const ey = br.top - cr.top + br.height / 2 + endYOffset;
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2 - curvature;
      setPathD(`M ${sx},${sy} Q ${mx},${my} ${ex},${ey}`);
    };
    const ro = new ResizeObserver(() => update());
    if (containerRef.current) ro.observe(containerRef.current);
    if (fromRef.current) ro.observe(fromRef.current);
    if (toRef.current) ro.observe(toRef.current);
    update();
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  const dash = dotted ? `${dotSpacing} ${dotSpacing}` : undefined;

  return (
    <svg
      fill="none"
      width={dim.width}
      height={dim.height}
      viewBox={`0 0 ${dim.width} ${dim.height}`}
      style={{ position: "absolute", left: 0, top: 0, zIndex: 0, pointerEvents: "none", transform: "translateZ(0)" }}
      aria-hidden
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={pathOpacity} strokeLinecap="round" strokeDasharray={dash} />
      <path d={pathD} strokeWidth={pathWidth} stroke={`url(#${id})`} strokeOpacity={1} strokeLinecap="round" strokeDasharray={dash} />
      <defs>
        <motion.linearGradient
          className="beam-grad"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={reduce ? undefined : { x1: coords.x1, x2: coords.x2, y1: coords.y1, y2: coords.y2 }}
          transition={reduce ? undefined : { delay, duration, ease: [0.16, 1, 0.3, 1], repeat: Infinity, repeatDelay: 0 }}
        >
          {/* two stops at offset 0 are intentional: a hard transparent-to-colour leading edge */}
          <stop stopColor={gradientStartColor} stopOpacity={0} />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity={0} />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

// A node the beams connect to: a white circle with a border + soft shadow.
export const Circle = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(
  function Circle({ className, children }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full border-2 border-solid border-[rgba(8,40,63,0.1)] bg-white p-3 shadow-[0_8px_24px_-10px_rgba(8,40,63,0.5)]",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

// Real brand logos (accurate SVGs), not placeholder shapes.
export const Icons = {
  user: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0e2a3f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  ),
  logo: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/favicon.svg" alt="The Gaggle" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
  ),
  vercel: () => (
    <svg viewBox="0 0 76 65" style={{ width: "100%", height: "100%" }} aria-hidden>
      <path d="M37.59.25l36.95 64H.64l36.95-64z" fill="#000" />
    </svg>
  ),
  typescript: () => (
    <svg viewBox="0 0 512 512" style={{ width: "100%", height: "100%" }}>
      <rect width="512" height="512" rx="72" fill="#3178c6" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#fff"
        d="M316.9 407.4v50.1c8.1 4.2 17.8 7.3 28.9 9.4s22.8 3.1 35.1 3.1c12 0 23.4-1.1 34.2-3.4 10.8-2.3 20.3-6.1 28.4-11.3 8.1-5.3 14.6-12.2 19.3-20.7s7.1-19 7.1-31.5c0-9.1-1.4-17-4.1-23.9s-6.6-12.9-11.7-18.2c-5.1-5.3-11.2-10.1-18.4-14.3s-15.2-8.2-24.2-12c-6.6-2.7-12.5-5.3-17.7-7.9-5.2-2.6-9.7-5.2-13.3-7.8s-6.5-5.5-8.5-8.5c-2-2.9-3-6.3-3-10.1 0-3.4.9-6.5 2.7-9.3s4.3-5.1 7.5-7.1c3.2-2 7.2-3.5 11.9-4.6 4.7-1.1 9.9-1.6 15.7-1.6 4.2 0 8.6.3 13.2.9 4.6.6 9.3 1.6 14 2.9 4.7 1.3 9.3 2.9 13.7 4.9s8.5 4.3 12.3 6.9v-46.8c-7.6-2.9-15.9-5.1-25-6.5s-19.4-2.1-31.1-2.1c-11.9 0-23.2 1.3-33.8 3.8s-20 6.5-28.1 12c-8.1 5.4-14.5 12.3-19.2 20.7-4.7 8.4-7 18.4-7 30.1 0 14.9 4.3 27.6 12.9 38.2 8.6 10.5 21.7 19.5 39.2 26.8 6.9 2.8 13.3 5.6 19.3 8.3s11.1 5.5 15.4 8.4c4.3 2.9 7.7 6.1 10.3 9.5 2.5 3.4 3.8 7.4 3.8 11.7 0 3.2-.8 6.2-2.3 9s-3.9 5.2-7.1 7.2c-3.2 2-7.1 3.6-11.9 4.8-4.7 1.1-10.3 1.7-16.7 1.7-10.9 0-21.6-1.9-32.2-5.7-10.6-3.8-20.5-9.5-29.6-17.1zm-84.2-123.3h64.2V243H117.8v41.1h63.9v182.9h50.9z"
      />
    </svg>
  ),
  tailwindcss: () => (
    <svg viewBox="0 0 256 154" style={{ width: "100%", height: "100%" }}>
      <path
        fill="#38bdf8"
        d="M128 0C93.9 0 72.5 17.1 64 51.2 76.8 34.1 91.7 27.7 108.8 32c9.7 2.4 16.7 9.5 24.4 17.3C145.8 62.1 160.3 76.8 192 76.8c34.1 0 55.5-17.1 64-51.2-12.8 17.1-27.7 23.5-44.8 19.2-9.7-2.4-16.7-9.5-24.4-17.3C174.2 14.7 159.7 0 128 0ZM64 76.8C29.9 76.8 8.5 93.9 0 128c12.8-17.1 27.7-23.5 44.8-19.2 9.7 2.4 16.7 9.5 24.4 17.3 12.6 12.8 27.1 27.5 58.8 27.5 34.1 0 55.5-17.1 64-51.2-12.8 17.1-27.7 23.5-44.8 19.2-9.7-2.4-16.7-9.5-24.4-17.3C110.2 91.5 95.7 76.8 64 76.8Z"
      />
    </svg>
  ),
  nextjs: () => (
    <svg viewBox="0 0 256 256" style={{ width: "100%", height: "100%" }}>
      <circle cx="128" cy="128" r="128" fill="#000" />
      <g fill="#fff">
        <rect x="86" y="78" width="17" height="100" />
        <rect x="153" y="78" width="17" height="100" />
        <polygon points="86,78 103,78 170,178 153,178" />
      </g>
    </svg>
  ),
  reactjs: () => (
    <svg viewBox="-11.5 -10.232 23 20.463" style={{ width: "100%", height: "100%" }}>
      <circle r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  framer: () => (
    <svg viewBox="0 0 256 384" style={{ width: "100%", height: "100%" }}>
      <path fill="#0055ff" d="M0 0h256v128H128zM0 128h128l128 128H0zM0 256h128v128z" />
    </svg>
  ),
  ncbi: () => (
    <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%" }} aria-hidden>
      <rect x="1" y="18" width="62" height="28" rx="7" fill="#20558a" />
      <text x="32" y="37.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="17" fill="#fff">NCBI</text>
    </svg>
  ),
  pubmed: () => (
    <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%" }} aria-hidden>
      <rect x="1" y="20" width="62" height="24" rx="6" fill="#326295" />
      <text x="32" y="37" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="13.5" fill="#fff">PubMed</text>
    </svg>
  ),
  cytoscape: () => (
    <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%" }} fill="none" aria-hidden>
      <g stroke="#8aa0b2" strokeWidth="2.4">
        <line x1="20" y1="18" x2="44" y2="22" /><line x1="44" y1="22" x2="30" y2="44" />
        <line x1="20" y1="18" x2="30" y2="44" /><line x1="44" y1="22" x2="50" y2="47" />
      </g>
      <circle cx="20" cy="18" r="7" fill="#ed6a5a" /><circle cx="44" cy="22" r="8" fill="#3b82f6" />
      <circle cx="30" cy="44" r="6" fill="#f4b21a" /><circle cx="50" cy="47" r="6" fill="#3fbf7f" />
    </svg>
  ),
  echarts: () => (
    <svg viewBox="0 0 64 64" style={{ width: "100%", height: "100%" }} aria-hidden>
      <rect x="9" y="34" width="9" height="22" rx="2" fill="#5470c6" />
      <rect x="22" y="24" width="9" height="32" rx="2" fill="#91cc75" />
      <rect x="35" y="15" width="9" height="41" rx="2" fill="#fac858" />
      <rect x="48" y="29" width="9" height="27" rx="2" fill="#ee6666" />
    </svg>
  ),
};
