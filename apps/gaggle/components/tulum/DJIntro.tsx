"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Cinematic opening: you land behind the decks in front of a crowd. As you
// scroll, the scene zooms and dissolves, handing off to the website beneath.
export function DJIntro() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);

  return (
    <section ref={ref} className="dj-intro" aria-label="Tulum DJ Academy intro">
      <div className="dj-intro__stage">
        <motion.div className="dj-intro__media" style={{ scale, opacity: mediaOpacity }}>
          <video
            className="dj-intro__video"
            src="/video/intro-dj.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          />
          <div className="dj-intro__scrim" aria-hidden />
        </motion.div>

        <motion.div className="dj-intro__content" style={{ opacity: textOpacity, y: textY }}>
          <span className="dj-intro__eyebrow">Tulum DJ Academy</span>
          <h1 className="dj-intro__title">
            Step behind <em>the decks.</em>
          </h1>
          <p className="dj-intro__sub">Feel the room. Then learn to move it.</p>
        </motion.div>

        <motion.div className="dj-intro__cue" style={{ opacity: cueOpacity }} aria-hidden>
          <span>Scroll</span>
          <span className="dj-intro__cue-line" />
        </motion.div>
      </div>
    </section>
  );
}
