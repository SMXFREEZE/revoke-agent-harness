import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { STEPS } from "@/lib/data/site";

const THEMES = ["violet", "sun", "pink"];

export function HowItWorks() {
  return (
    <section className="section how">
      <div className="shell">
        <header className="how__head">
          <span className="eyebrow">How it works</span>
          <SplitHeading as="h2" className="display h-1" text="Up and moving in under a minute." />
        </header>

        <ol className="how__grid">
          {STEPS.map((s, i) => (
            <Reveal as="li" className="how__step" key={s.n} delay={i * 0.1} theme={THEMES[i % 3]}>
              <span className="how__n display">{s.n}</span>
              <h3 className="how__title display">{s.title}</h3>
              <p className="how__body">{s.body}</p>
            </Reveal>
          ))}
          <li className="how__line" aria-hidden="true" />
        </ol>
      </div>
    </section>
  );
}
