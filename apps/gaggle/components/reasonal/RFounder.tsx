import { RWordReveal } from "./reveal";
import { TESTIMONIAL, SAFEGUARDS } from "@/lib/data/site";

export function RFounder() {
  return (
    <section className="rz-sec" id="founder">
      <div className="rz-card-w">
        <div className="rz-founder">
          <span className="rz-eyebrow" style={{ color: "#00a35a" }}>The rulebook</span>
          <RWordReveal as="h2" className="rz-founder__quote" text={TESTIMONIAL.quote} />
          <div className="rz-founder__by">
            <span className="rz-founder__name">{TESTIMONIAL.author}</span>
            <span className="rz-founder__handle">{TESTIMONIAL.handle}</span>
          </div>
          <ul className="rz-founder__chips">
            {SAFEGUARDS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
