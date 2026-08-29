import { RWordReveal } from "./reveal";
import { RLiquidWatch } from "./RLiquidWatch";
import { RVinylLazy } from "./RVinylLazy";

export function RBand() {
  return (
    <section className="rz-sec" id="book">
      <div className="rz-card-w">
        <div className="rz-band">
          <div className="rz-band__inner">
            <span className="rz-eyebrow">Yes, you</span>
            <RWordReveal as="h2" className="rz-band__title" text="Step up to the decks." />
            <p className="rz-body-text" style={{ color: "rgba(234,255,246,0.82)" }}>
              Book a free consultation and we will map your path, from your first beatmatch to
              your first paid gig. Drag the record to spin it.
            </p>
            <div className="rz-band__cta">
              <RLiquidWatch />
            </div>
          </div>
          {/* interactive 3D vinyl: idle-spins like a turntable, drag to scratch it */}
          <RVinylLazy />
        </div>
      </div>
    </section>
  );
}
