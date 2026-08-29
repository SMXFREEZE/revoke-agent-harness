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
              Meet The Gaggle
            </span>
            <RCharReveal
              className="rz-why__manifesto"
              text="A confident first answer is not a scientific verdict."
            />
            <RCharReveal
              className="rz-why__manifesto"
              text="Defense must make the strongest case. Prosecution must break it. Evidence and experiments decide what survives, not eloquence."
            />
            <RCharReveal className="rz-why__manifesto" text="When the leader changes, the old belief, the dissent, and every reason stay visible." />
          </div>
        </div>
      </div>
    </section>
  );
}
