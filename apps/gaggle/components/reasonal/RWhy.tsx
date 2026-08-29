import { RCharReveal } from "./reveal";
import { RWhyThumbs } from "./RWhyThumbs";

export function RWhy() {
  return (
    <section className="rz-sec" id="why">
      <div className="rz-card-w">
        <div className="rz-why">
          <RWhyThumbs />

          <div className="rz-why__inner">
            <span className="rz-eyebrow" style={{ color: "#00a35a" }}>
              Meet GutGutGoose
            </span>
            <RCharReveal
              className="rz-why__manifesto"
              text="Generic probiotics are a 58 billion dollar guess."
            />
            <RCharReveal
              className="rz-why__manifesto"
              text="We sequence your gut first, then build a probiotic matched to your DNA, not a one-size formula sold to a billion different guts."
            />
            <RCharReveal className="rz-why__manifesto" text="Read your gut, then feed it exactly what it is missing. Real science, in plain English." />
          </div>
        </div>
      </div>
    </section>
  );
}
