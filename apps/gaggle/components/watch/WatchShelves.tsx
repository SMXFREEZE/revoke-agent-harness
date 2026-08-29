"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Shelf } from "@/components/watch/Shelf";
import { CATEGORIES } from "@/lib/data/catalog";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Premium reveal wrapper for the discipline shelves. Each shelf rises +
 * de-blurs as it scrolls into view (staggered), and gains an accent rail on
 * hover via the `.w2-shelf` CSS. The `Shelf` component — carousel, catalog
 * data, links and interactions — is rendered untouched.
 */
export function WatchShelves() {
  const reduced = useReducedMotion();

  return (
    <div className="rz-w-shelves">
      {CATEGORIES.map((c, i) => (
        <motion.div
          key={c.id}
          className="w2-shelf"
          initial={reduced ? false : { opacity: 0, y: 38, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
          transition={{
            duration: 0.7,
            ease: EASE,
            delay: Math.min(i, 2) * 0.05,
          }}
        >
          <Shelf category={c} />
        </motion.div>
      ))}
    </div>
  );
}
