import { RWordReveal } from "./reveal";
import { RDiscGrid } from "./RDiscGrid";

export function RDisciplines() {
  return (
    <section className="rz-sec" id="disciplines">
      <div className="rz-card-w">
        <div className="rz-disc">
          <header className="rz-disc__head">
            <span className="rz-eyebrow">Independent roles</span>
            <RWordReveal as="h2" className="rz-h2" text="Every scientist gets one bounded job." />
            <p className="rz-body-text">
              Different missions, different queries, typed outputs, and visible provenance. No agent can quietly grade its own argument.
            </p>
          </header>
          <RDiscGrid />
        </div>
      </div>
    </section>
  );
}
