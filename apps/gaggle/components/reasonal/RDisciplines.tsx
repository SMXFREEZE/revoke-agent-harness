import { RWordReveal } from "./reveal";
import { RDiscGrid } from "./RDiscGrid";

export function RDisciplines() {
  return (
    <section className="rz-sec" id="disciplines">
      <div className="rz-card-w">
        <div className="rz-disc">
          <header className="rz-disc__head">
            <span className="rz-eyebrow">Reading your results</span>
            <RWordReveal as="h2" className="rz-h2" text="What every part of your report means." />
            <p className="rz-body-text">
              No jargon. A plain-English guide to the six things the live report measures, so you can read your own gut with confidence.
            </p>
          </header>
          <RDiscGrid />
        </div>
      </div>
    </section>
  );
}
