"use client";

import { motion } from "framer-motion";

export type Step = { n: string; t: string; b: string };

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * "How it works" track for the teachers page: glassy numbered nodes with a
 * per-step brand-color halo, a connecting gradient rail, and a spring-in
 * stagger on scroll. Content unchanged.
 */
export function TeachersSteps({ items }: { items: Step[] }) {
  return (
    <ol className="tx-how__grid">
      <span className="tx-how__rail" aria-hidden />
      {items.map((s, i) => (
        <motion.li
          className="tx-step"
          key={s.n}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 110, damping: 15, mass: 0.9, delay: i * 0.12 }}
        >
          <motion.span
            className="tx-step__node display"
            initial={{ scale: 0.6, rotate: -8 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: i * 0.12 + 0.05 }}
          >
            {s.n}
          </motion.span>
          <h3 className="tx-step__title">{s.t}</h3>
          <p className="tx-step__body">{s.b}</p>
        </motion.li>
      ))}
    </ol>
  );
}
