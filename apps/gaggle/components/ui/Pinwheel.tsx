"use client";

import { motion, useReducedMotion } from "framer-motion";

const PETALS = [
  { cx: 50, cy: 24, rx: 13, ry: 26, fill: "#6901ff" },
  { cx: 76, cy: 50, rx: 26, ry: 13, fill: "#2bb3ff" },
  { cx: 50, cy: 76, rx: 13, ry: 26, fill: "#ffdf2b" },
  { cx: 24, cy: 50, rx: 26, ry: 13, fill: "#ff4db5" },
];

/** A gently spinning pinwheel-X, for decorative accents. Stops under reduced-motion. */
export function Pinwheel({
  size = 60,
  className,
  duration = 14,
}: {
  size?: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      animate={reduce ? {} : { rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration }}
    >
      {PETALS.map((p, i) => (
        <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#fff" />
    </motion.svg>
  );
}
