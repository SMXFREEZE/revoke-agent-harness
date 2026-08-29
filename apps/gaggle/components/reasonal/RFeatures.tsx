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
            <span className="rz-eyebrow">The science</span>
            <RWordReveal as="h2" className="rz-h3" text="Real shotgun metagenomics, not a guess." />
            <p className="rz-feat__body">
              One stool sample reads every microbe&rsquo;s DNA, not just a handful of markers.
              Our MetaScope engine classifies your community, scores diversity and flags dysbiosis, in plain English.
            </p>
            <div className="rz-feat__media rz-feat__media--fade" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tulum/feat-mentor.jpg" alt="A scientist analysing a sample in the lab" loading="lazy" />
            </div>
          </article>

          <article
            className="rz-feat rz-feat--5"
            style={{ background: "var(--t-lilac)", ["--feat-tint" as string]: "var(--t-lilac)" }}
          >
            <span className="rz-eyebrow">Made for you</span>
            <RWordReveal as="h2" className="rz-h3" text="A formula matched to your gut and goals." />
            <p className="rz-feat__body">
              We pick the strains most likely to take root in your gut, matched to exactly what
              your sample is missing, chosen to colonise rather than just pass through. With a goose to root for.
            </p>
            <div className="rz-feat__media rz-feat__media--fade" data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tulum/feat-community.jpg" alt="People living well after rebuilding their gut" loading="lazy" />
            </div>
          </article>
        </div>
      </section>

      {/* stats card */}
      <section className="rz-sec" id="proof">
        <div className="rz-card-w">
          <div className="rz-feat" style={{ background: "var(--t-blue)", minHeight: "auto" }}>
            <span className="rz-eyebrow">By the numbers</span>
            <RWordReveal as="h2" className="rz-h3" text="The case for sequencing first." />
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
