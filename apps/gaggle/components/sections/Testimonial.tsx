"use client";

import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Marquee } from "@/components/ui/Marquee";
import { TESTIMONIAL, PROOF } from "@/lib/data/site";

const LOVE = [
  "Mixed martial arts",
  "Daily wellness",
  "Yoga & meditation",
  "Brain breaks",
  "Happy classrooms",
  "Move every day",
];

const initials = (name: string) => {
  const clean = name.replace(/[@.]/g, "").trim();
  const parts = clean.split(/\s+/);
  const out = parts.length > 1 ? parts.map((w) => w[0]).slice(0, 2).join("") : clean.slice(0, 2);
  return out.toUpperCase();
};

export function Testimonial() {
  return (
    <section className="section quote" id="love">
      <div className="shell">
        <header className="quote__head">
          <span className="eyebrow">Loved by educators</span>
          <SplitHeading as="h2" className="display h-1" text="What classrooms are saying." />
        </header>

        <div className="quote__wall">
          {/* Featured (preserved verbatim) */}
          <Reveal className="quote__feature" theme="violet">
            <span className="quote__mark display" aria-hidden>
              &ldquo;
            </span>
            <blockquote className="quote__feature-text display">{TESTIMONIAL.quote}</blockquote>
            <footer className="quote__by">
              <span className="quote__avatar" aria-hidden>
                {initials(TESTIMONIAL.author)}
              </span>
              <div>
                <strong>{TESTIMONIAL.author}</strong>
                <span>{TESTIMONIAL.handle}</span>
              </div>
            </footer>
          </Reveal>

          {/* Educator wall */}
          {PROOF.map((p, i) => (
            <Reveal
              className="quote__card"
              key={p.name}
              theme={p.theme}
              delay={0.04 * i}
            >
              <p className="quote__card-text">{p.quote}</p>
              <footer className="quote__by">
                <span className="quote__avatar" aria-hidden>
                  {initials(p.name)}
                </span>
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.role}</span>
                </div>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>

      <Marquee className="quote__marquee" items={LOVE} />
    </section>
  );
}
