"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { BouncyText } from "@/components/ui/BouncyText";
import { ConfettiButton } from "@/components/ui/ConfettiButton";
import { Button } from "@/components/ui/Button";
import { APP_LINKS } from "@/lib/data/site";

const EASE = [0.16, 1, 0.3, 1] as const;

const MovementMachine = dynamic(
  () => import("@/components/hero/MovementMachine").then((m) => m.MovementMachine),
  {
    ssr: false,
    loading: () => (
      <div className="showcase">
        <div className="showcase__frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/hero-classroom.jpg" alt="A class moving together during an X Movement break" />
        </div>
      </div>
    ),
  },
);

/** A key word with a sun-yellow crayon underline that draws itself in. */
function CrayonWord({ children, delay = 1 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.span
      className="crayon hero__pop"
      initial={{ opacity: 0, y: "0.5em" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 15, delay: delay - 0.15 }}
    >
      <span className="hero__alive">{children}</span>
      <svg className="crayon__ink" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M3 11 C 40 3, 70 14, 100 8 S 165 3, 197 10"
          fill="none"
          stroke="var(--sun)"
          strokeWidth={7}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay, duration: 0.6, ease: "easeInOut" }}
        />
      </svg>
    </motion.span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} id="top" className="hero" data-theme="violet">
      <div className="hero__scrim" aria-hidden />
      <div className="hero__blobs" aria-hidden>
        <span className="blob blob--violet" />
        <span className="blob blob--sun" />
        <span className="blob blob--teal" />
      </div>

      <div className="hero__inner shell">
        <motion.div className="hero__copy" style={{ opacity: fade }}>
          <motion.span
            className="pill hero__pill"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="hero__pill-dot" /> Health &amp; wellness for every classroom
          </motion.span>

          <h1 className="hero__title display h-hero">
            <BouncyText text="Kids don't just move." delay={0.15} />
            <span className="hero__title-row">
              <BouncyText text="They come" delay={0.5} />{" "}
              <CrayonWord delay={1}>alive.</CrayonWord>
            </span>
          </h1>

          <motion.p
            className="lede hero__lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7, ease: EASE }}
          >
            X Movement&rsquo;s online health &amp; wellness resource, 300+ energizing videos of
            fitness, dance, yoga and mindfulness, now streaming in the classroom or at home.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          >
            <ConfettiButton href={APP_LINKS.watch.href}>Watch Now →</ConfettiButton>
            <Button href="#what" variant="ghost" size="lg">
              See how it works
            </Button>
          </motion.div>

          <motion.div
            className="hero__trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <span>Loved in 3,000+ schools</span>
            <span className="hero__trust-dot" />
            <span>Evidence-based</span>
            <span className="hero__trust-dot" />
            <span>No training required</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__media"
          style={{ y: mediaY }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
        >
          <MovementMachine />
        </motion.div>
      </div>
    </section>
  );
}
