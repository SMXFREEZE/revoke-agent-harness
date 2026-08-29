"use client";

import { SplitHeading } from "@/components/ui/SplitHeading";
import { ColorWipe } from "@/components/ui/ColorWipe";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { CALENDAR, APP_LINKS } from "@/lib/data/site";

const THEME: Record<string, string> = {
  water: "sky",
  pink: "pink",
  bhm: "sun",
  bell: "teal",
};

export function Calendar() {
  return (
    <section className="section calendar calendar--bright" id="calendar" data-theme="violet">
      <div className="shell">
        <div className="calendar__panel">
          <span className="blob blob--violet calendar__blob" aria-hidden />
          <header className="calendar__head">
            <span className="eyebrow calendar__eyebrow">Global Awareness Calendar</span>
            <SplitHeading
              as="h2"
              className="display h-1 calendar__title"
              text={"Movement with meaning,\nall year round."}
            />
            <p className="lede calendar__lede">
              Themed programs that connect physical activity to the moments that matter, so
              classrooms move, learn and care together.
            </p>
          </header>

          <div className="calendar__grid">
            {CALENDAR.map((c, i) => (
              <ColorWipe
                as="article"
                className="calendar__card"
                key={c.id}
                theme={THEME[c.id] ?? "violet"}
                delay={i * 80}
              >
                <div className="calendar__banner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.art} alt="" className="calendar__art" loading="lazy" />
                  <span className="calendar__date">{c.date}</span>
                </div>
                <div className="calendar__body">
                  <h3 className="calendar__name display">{c.name}</h3>
                  <p className="calendar__blurb">{c.blurb}</p>
                </div>
              </ColorWipe>
            ))}
          </div>

          <div className="calendar__cta">
            <ShimmerButton href={APP_LINKS.watch.href} variant="sun" size="lg">
              Explore the calendar →
            </ShimmerButton>
          </div>
        </div>
      </div>
    </section>
  );
}
