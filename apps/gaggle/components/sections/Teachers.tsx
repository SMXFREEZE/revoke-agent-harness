"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Button } from "@/components/ui/Button";
import { APP_LINKS } from "@/lib/data/site";

const AUDIENCES = [
  {
    id: "teachers",
    tag: "For teachers",
    title: "Brain breaks that actually reset the room.",
    points: ["Curriculum-friendly, classroom-safe routines", "Ready-made lesson add-ons & resources", "No equipment, no prep, no sweat"],
    cta: { label: "Teacher Resources", href: APP_LINKS.teachers.href },
    theme: "violet",
    img: "/images/gen/teach-teachers.jpg",
  },
  {
    id: "home",
    tag: "For families",
    title: "Energy out, smiles in, right from the living room.",
    points: ["Family-friendly programs for every age", "Calm-down flows for the evening", "Stream on any screen, anytime"],
    cta: { label: "Start at home", href: APP_LINKS.watch.href },
    theme: "sun",
    img: "/images/gen/teach-families.jpg",
  },
];

export function Teachers() {
  return (
    <section className="section audience" id="teachers">
      <div className="shell">
        <header className="audience__head">
          <span className="eyebrow">Made for you</span>
          <SplitHeading as="h2" className="display h-1" text="Built for school and home." />
        </header>

        <div className="audience__grid">
          {AUDIENCES.map((a, i) => (
            <Reveal
              as="article"
              className="audience__card"
              theme={a.theme}
              key={a.id}
              delay={i * 0.1}
            >
              <div className="audience__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt="" loading="lazy" />
              </div>
              <div className="audience__content">
                <span className="audience__tag">{a.tag}</span>
                <h3 className="display audience__title">{a.title}</h3>
                <ul className="audience__points">
                  {a.points.map((p) => (
                    <li key={p}>
                      <span className="audience__check" aria-hidden>
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button href={a.cta.href} variant="accent" arrow>
                  {a.cta.label}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
