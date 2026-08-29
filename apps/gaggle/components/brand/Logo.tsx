"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  /** On dark backgrounds the wordmark sits on a white chip so it stays legible. */
  onDark?: boolean;
  height?: number;
}

/**
 * The X Movement Classroom lockup — a crisp VECTOR mark (scales to any DPI) plus
 * the wordmark set in the brand font, so it never looks like a blurry bitmap.
 */
export function Logo({ className, onDark = false, height = 30 }: LogoProps) {
  return (
    <motion.span
      className={cn("logo", onDark && "logo--dark", className)}
      style={{ height, display: "inline-flex", alignItems: "center", gap: height * 0.3 }}
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/images/brand/x-mark.svg"
        alt=""
        aria-hidden
        style={{ height: height * 0.96, width: "auto" }}
        draggable={false}
        variants={{
          rest: { scale: 1, rotate: 0 },
          hover: { scale: 1.06, rotate: [0, -8, 8, -3, 0] },
        }}
        transition={{ type: "spring", stiffness: 320, damping: 12, rotate: { duration: 0.6 } }}
      />
      <span className="logo__word" style={{ fontSize: height * 0.64 }}>
        X Movement Classroom
      </span>
    </motion.span>
  );
}
