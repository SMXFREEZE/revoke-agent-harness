"use client";

import { motion } from "framer-motion";
import { Pinwheel } from "@/components/ui/Pinwheel";

/**
 * Hero showcase — the classroom photo in an elegant premium frame, brought to
 * life with a gently spinning pinwheel and a pulsing sun as refined accents.
 */
export function MovementMachine() {
  return (
    <div className="showcase">
      <motion.span
        className="showcase__glow"
        aria-hidden
        animate={{ opacity: [0.5, 0.82, 0.5], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      <div className="showcase__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/hero-classroom.jpg" alt="A class moving together during an X Movement break" />
        <span className="showcase__badge">
          <span className="showcase__badge-dot" /> Daily movement breaks
        </span>
      </div>

      <Pinwheel size={88} className="showcase__pinwheel" duration={16} />

      <motion.span
        className="showcase__sun"
        aria-hidden
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
      >
        <span className="showcase__sun-core" />
      </motion.span>
    </div>
  );
}
