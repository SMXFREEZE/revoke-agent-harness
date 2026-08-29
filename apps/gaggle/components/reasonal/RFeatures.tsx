import { RWordReveal } from "./reveal";
import { Counter } from "@/components/ui/Counter";
import { STATS } from "@/lib/data/site";

export function RFeatures() {
  return (
    <>
      {/* two-up benefit cards */}
      <section className="rz-sec">
        <div className="rz-card-w rz-grid12">
          <article
            className="rz-feat rz-feat--7"
            style={{ background: "var(--t-cream)", ["--feat-tint" as string]: "var(--t-cream)" }}
          >
            <span className="rz-eyebrow">Bright Data evidence</span>
            <RWordReveal as="h2" className="rz-h3" text="Evidence that can fight back." />
            <p className="rz-feat__body">
              Defense and Prosecution retrieve independently. Every admitted claim keeps its URL,
              retrieval time, source class, biological scope, methodology flags, and content hash.
            </p>
            <div className="rz-feat__media rz-feat__media--fade" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tulum/feat-mentor.jpg" alt="A scientist reviewing microbiome evidence" loading="lazy" />
            </div>
          </article>

          <article
            className="rz-feat rz-feat--5"
            style={{ background: "var(--t-lilac)", ["--feat-tint" as string]: "var(--t-lilac)" }}
          >
            <span className="rz-eyebrow">Daytona computation</span>
            <RWordReveal as="h2" className="rz-h3" text="Scores the model cannot invent." />
            <p className="rz-feat__body">
              Compatibility, sensitivity, and counterfactual checks run as deterministic code in
              an isolated sandbox. Inputs, outputs, and hashes stay attached to the decision.
            </p>
            <div className="rz-feat__media rz-feat__media--fade" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tulum/feat-community.jpg" alt="A research team reviewing experimental results" loading="lazy" />
            </div>
          </article>
        </div>
      </section>

      {/* stats card */}
      <section className="rz-sec" id="proof">
        <div className="rz-card-w">
          <div className="rz-feat" style={{ background: "var(--t-blue)", minHeight: "auto" }}>
            <span className="rz-eyebrow">Verified golden run</span>
            <RWordReveal as="h2" className="rz-h3" text="One case. Every reason inspectable." />
            <div className="rz-stats">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="rz-stat__num">
                    <Counter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="rz-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
