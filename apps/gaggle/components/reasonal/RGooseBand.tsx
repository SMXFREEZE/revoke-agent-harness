import Link from "next/link";
import { RWordReveal } from "./reveal";
import { RGooseLazy } from "./RGooseLazy";

// Signature 3D proposal token in the original section shell.
export function RGooseBand() {
  return (
    <section className="rz-sec" id="goose">
      <div className="rz-card-w">
        <div className="rz-band">
          <div className="rz-band__inner">
            <span className="rz-eyebrow">The human boundary</span>
            <RWordReveal as="h2" className="rz-band__title" text="One proposal. Exact ID plus hash." />
            <p className="rz-body-text" style={{ color: "rgba(234,255,246,0.82)" }}>
              Read-only research can run autonomously. Promotion cannot. The scientist sees the
              immutable proposal, evidence, dissent, rollback scope, and SHA-256 hash before any write. Drag to inspect it.
            </p>
            <div className="rz-band__cta">
              <Link href="/#agents" className="rz-rep__btn rz-rep__btn--go" style={{ textDecoration: "none" }}>
                Inspect the approval state
              </Link>
            </div>
          </div>
          <RGooseLazy />
        </div>
      </div>
    </section>
  );
}
