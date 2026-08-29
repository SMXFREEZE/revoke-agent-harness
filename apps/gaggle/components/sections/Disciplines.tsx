"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { PinnedRow } from "@/components/ui/PinnedRow";
import { Marquee } from "@/components/ui/Marquee";
import { DISCIPLINES } from "@/lib/data/site";

export function Disciplines() {
  return (
    <section className="section programs" id="programs">
      <div className="shell">
        <header className="programs__head">
          <div className="stack gap-s">
            <span className="eyebrow">The programs</span>
            <SplitHeading as="h2" className="display h-1" text={"One library.\nEvery kind of move."} />
          </div>
          <div className="programs__intro-wrap">
            <p className="lede programs__intro">
              Eight bright worlds, calm or high-energy, each a tap away. Pick a vibe and
              there&rsquo;s a follow-along ready to play.
            </p>
            <ul className="programs__legend" aria-hidden>
              {DISCIPLINES.slice(0, 7).map((d) => (
                <li key={d.id} data-theme={d.theme} title={d.name}>
                  <span />
                </li>
              ))}
            </ul>
          </div>
        </header>
      </div>

      <Marquee
        className="programs__ticker"
        items={["Fitness", "Dance", "Yoga", "Mindfulness", "Meditation", "Sports", "Martial Arts"]}
        sep="✺"
      />

      <PinnedRow className="programs__pin">
        {DISCIPLINES.map((d, i) => (
          <article key={d.id} className="disc-card" data-theme={d.theme}>
            <div className="disc-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.art}
                alt={`A child enjoying ${d.name.toLowerCase()}`}
                className="disc-card__art"
                loading="lazy"
              />
              <span className="disc-card__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="disc-card__chip">Follow-along</span>
            </div>
            <div className="disc-card__body">
              <h3 className="disc-card__name display">{d.name}</h3>
              <p className="disc-card__blurb">{d.blurb}</p>
            </div>
          </article>
        ))}
      </PinnedRow>

      <div className="shell">
        <Reveal className="programs__foot" delay={0.1}>
          <span className="pill pill--accent" data-theme="coral">
            300+ videos · new drops every month
          </span>
        </Reveal>
      </div>
    </section>
  );
}
