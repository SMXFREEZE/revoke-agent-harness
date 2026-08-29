import { RWordReveal } from "./reveal";

// #science — what the MetaScope engine actually does, the same pipeline the live
// report runs above. Reuses the Tulum steps-card pattern.
const PIPELINE = [
  { n: "01", title: "Quality control", body: "Raw DNA reads are trimmed and filtered, low-quality bases and adapters removed, so only clean signal moves forward." },
  { n: "02", title: "Classify", body: "Each read is matched against a reference of gut microbes using canonical k-mers and lowest-common-ancestor calls, the same idea behind Kraken and MetaPhlAn." },
  { n: "03", title: "Score", body: "We turn the community into numbers: Shannon and Simpson diversity, richness, Firmicutes-to-Bacteroidetes balance, enterotype and dysbiosis flags." },
  { n: "04", title: "Match", body: "Your profile, diet and goals choose the probiotic strains most likely to take root, matched to exactly what your community is missing." },
];

export function RScience() {
  return (
    <section className="rz-sec" id="science">
      <div className="rz-card-w">
        <div className="rz-steps">
          <header className="rz-steps__head">
            <span className="rz-eyebrow">The science</span>
            <RWordReveal as="h2" className="rz-h2" text="Raw reads to a real plan, in four steps." />
            <p className="rz-body-text" style={{ marginTop: "0.8rem", maxWidth: "56ch" }}>
              The report above is not a mockup. It runs this exact pipeline in your browser, the
              same in-silico approach used to validate real metagenomic tools.
            </p>
          </header>
          <div className="rz-steps__grid">
            {PIPELINE.map((s) => (
              <article className="rz-step" key={s.n}>
                <span className="rz-step__n">{s.n}</span>
                <h3 className="rz-step__title">{s.title}</h3>
                <p className="rz-step__body">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
