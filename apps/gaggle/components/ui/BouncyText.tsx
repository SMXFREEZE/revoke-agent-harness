"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";

/**
 * Headline words that tumble in like building blocks: a bouncy spring with a
 * touch of overshoot and rotation. Playful, but a clean stagger keeps it
 * crafted rather than chaotic. Respects reduced-motion (framer handles it).
 */
export function BouncyText({
  text,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em" }}>
            <motion.span
              aria-hidden
              style={{ display: "inline-block", willChange: "transform" }}
              initial={{ y: "0.9em", opacity: 0, rotate: -5 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 15,
                delay: delay + i * stagger,
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
