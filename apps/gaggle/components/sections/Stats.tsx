import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { STATS } from "@/lib/data/site";

const THEMES = ["violet", "teal", "coral"];

export function Stats() {
  return (
    <section className="section stats" id="proof">
      <div className="shell">
        <h2 className="sr-only">By the numbers</h2>
        <div className="stats__grid">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <SpotlightCard className="stats__card" theme={THEMES[i % THEMES.length]}>
                <div className="stats__num display">
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <h3 className="stats__label">
                  {s.label}
                  {i === 2 && <span className="stats__tag">evidence-based</span>}
                </h3>
                <p className="stats__blurb">{s.blurb}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
