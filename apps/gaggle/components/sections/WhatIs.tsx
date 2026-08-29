"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

const POINTS = [
  { t: "Physically distanced", b: "Every routine is designed for the space you have, desks pushed back or living-room floor.", theme: "violet" },
  { t: "Stand up & follow along", b: "Students mirror the screen. Energizing, never over-exerted.", theme: "teal" },
  { t: "Zero training needed", b: "No prep for teachers or parents. Simply press play.", theme: "coral" },
  { t: "Just like Netflix", b: "Login, browse, and stream. Familiar, friendly, instant.", theme: "pink" },
];

const CHIPS = [
  { label: "All", theme: "violet", active: true },
  { label: "Fitness", theme: "violet" },
  { label: "Dance", theme: "pink" },
  { label: "Yoga", theme: "teal" },
  { label: "Mindfulness", theme: "sun" },
];

const QUEUE = [
  { id: "disc-fitness", label: "Fitness" },
  { id: "disc-yoga", label: "Yoga" },
  { id: "disc-meditation", label: "Meditation" },
  { id: "disc-martial-arts", label: "Martial Arts" },
];

export function WhatIs() {
  const reduced = usePrefersReducedMotion();
  return (
    <section className="section what" id="what" data-theme="sky">
      <div className="shell what__grid">
        <div className="what__copy">
          <span className="eyebrow">What it is</span>
          <SplitHeading as="h2" className="display h-1" text={"On-demand movement,\nbuilt for the classroom."} />
          <p className="lede" style={{ marginTop: "1.2rem" }}>
            300+ videos across fitness, dance, yoga, mindfulness, meditation, sports and
            martial arts, the same energy and engagement of our live experiences,
            leaving students happy, healthy and smiling.
          </p>

          <ul className="what__points">
            {POINTS.map((p, i) => (
              <Reveal as="li" className="what__point" key={p.t} delay={i * 0.06} theme={p.theme}>
                <span className="what__check" aria-hidden>
                  ✓
                </span>
                <div>
                  <strong>{p.t}</strong>
                  <span>{p.b}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal className="what__media" delay={0.1}>
          <div className="what__player">
            <div className="what__player-top">
              <span className="what__brand-dot" aria-hidden />
              <span className="what__player-label">X Movement</span>
              <span className="what__live">● Now playing</span>
            </div>
            <div className="what__chips">
              {CHIPS.map((c) => (
                <span
                  key={c.label}
                  className="what__chip"
                  data-theme={c.theme}
                  data-active={c.active ? "true" : undefined}
                >
                  {c.label}
                </span>
              ))}
            </div>
            <div className="what__screen">
              <video
                className="what__screen-video"
                src="/videos/dance.mp4"
                poster="/videos/dance.jpg"
                autoPlay={!reduced}
                controls={reduced}
                muted
                loop
                playsInline
                preload="metadata"
              />
              <span className="what__play" aria-hidden>
                ▶
              </span>
            </div>
            <div className="what__queue">
              {QUEUE.map((q) => (
                <figure key={q.id} className="what__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/gen/${q.id}.jpg`} alt={q.label} loading="lazy" />
                  <figcaption>{q.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
