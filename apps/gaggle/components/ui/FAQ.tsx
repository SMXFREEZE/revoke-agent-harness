"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type QA = { q: string; a: string };

const EASE = [0.16, 1, 0.3, 1] as const;

export function FAQ({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq ip-faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            className="faq__item"
            key={i}
            data-open={isOpen}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: EASE, delay: i * 0.05 }}
          >
            <button
              className="faq__q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <span className="faq__icon" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="faq__a"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.36, ease: EASE }}
                >
                  <div>
                    <p>{item.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
