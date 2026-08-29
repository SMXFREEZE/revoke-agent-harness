"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const WORDS = ["Move.", "Play.", "Rise."];

/**
 * A jaw-dropping neon "sunrise" moment — a glowing radial sun, a slow psychedelic
 * shimmer, and big expressive stacked type. Y2K-bright, art-forward, classroom-safe.
 */
export function RiseBanner() {
  return (
    <section className="rise">
      <span className="rise__shimmer" aria-hidden />
      <span className="rise__star rise__star--1" aria-hidden />
      <span className="rise__star rise__star--2" aria-hidden />
      <span className="rise__star rise__star--3" aria-hidden />

      <div className="shell rise__inner">
        <motion.span
          className="rise__kicker"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Five minutes. Whole-room energy.
        </motion.span>

        <h2 className="rise__title display">
          {WORDS.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, y: "0.4em", filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 + i * 0.12 }}
            >
              {w}
            </motion.span>
          ))}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Button href="/watch" variant="white" arrow>
            Start a movement break
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
