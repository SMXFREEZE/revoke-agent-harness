"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HIGHLIGHTS } from "@/lib/data/site";

// deterministic pseudo-random heights for the equalizer (no Math.random at module
// scope so SSR/CSR match); 56 bars across the bottom.
const BARS = Array.from({ length: 56 }, (_, i) => {
  const h = 22 + Math.round(38 * (Math.sin(i * 1.7) * 0.5 + 0.5)); // base height %
  const dur = 0.7 + ((i * 37) % 60) / 100; // 0.7–1.3s
  const delay = ((i * 53) % 100) / 100; // 0–1s
  return { h, dur, delay };
});

export function Hero() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HIGHLIGHTS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="tdj-hero" id="top">
      <div className="tdj-hero__aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="tdj-hero__inner">
        <motion.span
          className="tdj-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          The only DJ school in Tulum
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          Your fast track to <span className="grad-text">the decks.</span>
        </motion.h1>

        <motion.div
          className="tdj-hero__rot"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="tdj-hero__rot-arrow" aria-hidden>›</span>
          <span className="tdj-rot">
            <AnimatePresence mode="wait">
              <motion.span
                key={idx}
                className="tdj-rot__item grad-text"
                initial={{ opacity: 0, y: 18, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -18, rotateX: 40 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {HIGHLIGHTS[idx]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.div>

        <motion.p
          className="tdj-hero__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Learn to mix, produce and perform with hands-on mentorship. Record cinematic
          sets in breathtaking locations and join a global community of artists.
        </motion.p>

        <motion.div
          className="tdj-hero__cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <a href="#book" className="tdj-btn">Become a DJ →</a>
          <a href="#programs" className="tdj-btn tdj-btn--ghost">Explore programs</a>
        </motion.div>

        <motion.div
          className="tdj-hero__stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <span className="tdj-chip"><b>2 weeks</b> stage ready</span>
          <span className="tdj-chip"><b>1:1</b> mentorship</span>
          <span className="tdj-chip"><b>Club-grade</b> gear</span>
          <span className="tdj-chip"><b>Global</b> community</span>
        </motion.div>
      </div>

      <div className="tdj-eq" aria-hidden>
        {BARS.map((b, i) => (
          <i
            key={i}
            style={{
              height: `${b.h}%`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
