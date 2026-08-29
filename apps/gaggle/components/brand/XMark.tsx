"use client";

import { motion } from "framer-motion";

/**
 * The X Movement pinwheel mark, redrawn as an animatable inline SVG (their own
 * brand). Four rounded petals in the brand palette bloom in on mount and the
 * whole pinwheel turns a quarter on hover.
 */
const PETALS = [
  { cx: 50, cy: 25, rx: 12, ry: 24, fill: "#6901ff" }, // violet
  { cx: 75, cy: 50, rx: 24, ry: 12, fill: "#2bb3ff" }, // sky
  { cx: 50, cy: 75, rx: 12, ry: 24, fill: "#ffdf2b" }, // sun
  { cx: 25, cy: 50, rx: 24, ry: 12, fill: "#ff4db5" }, // pink
];

export function XMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      initial="hidden"
      animate="show"
      whileHover="hover"
      style={{ overflow: "visible", flex: "none" }}
    >
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        variants={{
          hidden: { rotate: 0 },
          show: { rotate: 45, transition: { type: "spring", stiffness: 120, damping: 14 } },
          hover: { rotate: 135, transition: { type: "spring", stiffness: 150, damping: 12 } },
        }}
      >
        {PETALS.map((p, i) => (
          <motion.ellipse
            key={i}
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            fill={p.fill}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            variants={{
              hidden: { scale: 0, opacity: 0 },
              show: { scale: 1, opacity: 0.92 },
              hover: { scale: 1.07, opacity: 1 },
            }}
            transition={{ type: "spring", stiffness: 280, damping: 13, delay: 0.08 * i }}
          />
        ))}
        <circle cx="50" cy="50" r="8.5" fill="#ffffff" />
      </motion.g>
    </motion.svg>
  );
}
