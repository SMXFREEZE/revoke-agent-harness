import Link from "next/link";
import { RWordReveal } from "./reveal";
import { RGooseLazy } from "./RGooseLazy";

// Signature 3D moment: the brand mascot in soft-clay 3D. Mirrors Tulum's
// vinyl band, same .rz-band shell, GutGutGoose copy.
export function RGooseBand() {
  return (
    <section className="rz-sec" id="goose">
      <div className="rz-card-w">
        <div className="rz-band">
          <div className="rz-band__inner">
            <span className="rz-eyebrow">Made for your gut</span>
            <RWordReveal as="h2" className="rz-band__title" text="Your daily capsule." />
            <p className="rz-body-text" style={{ color: "rgba(234,255,246,0.82)" }}>
              One capsule, matched to your DNA from the report above. The strains most likely to
              take root in your gut, chosen to fill exactly what your sample is missing. Drag to spin it.
            </p>
            <div className="rz-band__cta">
              <Link href="/console" className="rz-rep__btn rz-rep__btn--go" style={{ textDecoration: "none" }}>
                See your gut read live
              </Link>
            </div>
          </div>
          <RGooseLazy />
        </div>
      </div>
    </section>
  );
}
