"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePlayer } from "@/components/player/PlayerProvider";
import { FEATURED, getCategory, PROGRAMS } from "@/lib/data/catalog";

const THEME: Record<string, string> = {
  fitness: "violet", dance: "pink", yoga: "teal", mindfulness: "sun",
  meditation: "plum", sports: "coral", "martial-arts": "sky",
};

function PlayGlyph() {
  return (
    <svg className="rz-play-ico" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.79-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function WatchFeatured() {
  const open = usePlayer();
  const reduced = useReducedMotion();
  const cat = getCategory(FEATURED.category);

  // Staggered cinematic entrance for the content column.
  const stage = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
  };
  const rise = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  return (
    <section className="rz-sec rz-sec--first">
      <div className="rz-card-w">
        <motion.div
          className="w2-feat-stage"
          initial={reduced ? false : { opacity: 0, scale: 0.985, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <div className="rz-w-feat" data-theme={THEME[FEATURED.category] ?? "violet"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FEATURED.poster} alt={FEATURED.title} className="rz-w-feat__bg w2-feat-bg" />
            <div className="rz-w-feat__overlay" aria-hidden />
            <div className="w2-feat-cine" aria-hidden />

            <motion.div
              className="rz-w-feat__content"
              variants={stage}
              initial="hidden"
              animate="show"
            >
              <motion.span className="rz-w-feat__badge" variants={rise}>
                <span className="rz-w-feat__live" aria-hidden /> Featured this week
              </motion.span>
              <motion.span className="w2-feat-kicker" variants={rise}>
                {cat?.name} • Press play
              </motion.span>
              <motion.h1 className="rz-w-feat__title" variants={rise}>
                {FEATURED.title}
              </motion.h1>
              <motion.p className="rz-w-feat__desc" variants={rise}>
                {FEATURED.description}
              </motion.p>
              <motion.div className="rz-w-feat__meta" variants={rise}>
                <span className="rz-w-feat__pill">{cat?.name}</span>
                <span className="rz-w-feat__pill">{FEATURED.duration}</span>
                <span className="rz-w-feat__pill">{FEATURED.level}</span>
              </motion.div>
              <motion.div className="rz-w-feat__actions" variants={rise}>
                <button
                  className="rz-btn rz-btn--light rz-w-feat__play w2-feat-play"
                  onClick={() => open(FEATURED)}
                >
                  <PlayGlyph /> Play now
                </button>
                <a className="rz-w-feat__browse w2-feat-browse" href="#rz-library">
                  Browse {PROGRAMS.length * 18}+ videos
                  <span className="w2-feat-browse__arrow" aria-hidden>→</span>
                </a>
              </motion.div>
            </motion.div>

            <span className="w2-feat-seam" aria-hidden />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
