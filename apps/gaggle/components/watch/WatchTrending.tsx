"use client";

import { Marquee } from "@/components/ui/uilayouts/marquee";
import { PROGRAMS, getCategory } from "@/lib/data/catalog";

const THEME: Record<string, string> = {
  fitness: "violet", dance: "pink", yoga: "teal", mindfulness: "sun",
  meditation: "plum", sports: "coral", "martial-arts": "sky",
};

type P = (typeof PROGRAMS)[number];

function PosterChip({ p }: { p: P }) {
  return (
    <figure className="rz-mq-card" data-theme={THEME[p.category] ?? "violet"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.poster} alt="" className="rz-mq-card__img" loading="lazy" />
      <figcaption className="rz-mq-card__cap">
        <span className="rz-mq-card__cat">{getCategory(p.category)?.name}</span>
        <span className="rz-mq-card__title">{p.title}</span>
      </figcaption>
    </figure>
  );
}

/** Trending strip built on the ui-layouts Marquee — two opposing rows of
 *  premium posters that drift and pause on hover. Decorative (the playable
 *  cards live in the carousels below). */
export function WatchTrending() {
  const row1 = PROGRAMS.slice(0, 9);
  const row2 = [...PROGRAMS.slice(9), ...PROGRAMS.slice(0, 3)];

  return (
    <div className="rz-w-trending" aria-hidden>
      <Marquee pauseOnHover repeat={3} className="rz-w-mq">
        {row1.map((p) => (
          <PosterChip key={p.id} p={p} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover repeat={3} className="rz-w-mq">
        {row2.map((p) => (
          <PosterChip key={`${p.id}-b`} p={p} />
        ))}
      </Marquee>
    </div>
  );
}
