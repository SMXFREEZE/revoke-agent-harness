import { RWordReveal } from "./reveal";
import { TESTIMONIAL, PROOF } from "@/lib/data/site";

export function RTestimonials() {
  return (
    <section className="rz-sec" id="love">
      <div className="rz-card-w">
        <div className="rz-proof">
          <header className="rz-proof__head">
            <span className="rz-eyebrow">The memorable ones</span>
            <RWordReveal as="h2" className="rz-h2" text="Built in a lab, led by a goose." />
            <p className="rz-body-text" style={{ marginTop: "0.8rem", maxWidth: "52ch" }}>
              Real shotgun-metagenomic science that refuses to take itself too seriously.
              Here is how one persistent scientific case changed its mind.
            </p>
          </header>

          <div className="rz-proof__feature">
            <span className="rz-proof__pill">
              <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden fill="currentColor">
                <path d="M12 2l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.98 6.1 20.18l1.13-6.58L2.45 8.94l6.6-.96L12 2z" />
              </svg>
              Featured
            </span>
            <blockquote className="rz-proof__feature-q">&ldquo;{TESTIMONIAL.quote}&rdquo;</blockquote>
            <span className="rz-proof__name">{TESTIMONIAL.author}</span>
            <div className="rz-proof__role">{TESTIMONIAL.handle}</div>
          </div>

          <div className="rz-proof__grid">
            {PROOF.map((p) => (
              <article className="rz-proof__card" key={p.name}>
                <p className="rz-proof__q">&ldquo;{p.quote}&rdquo;</p>
                <div>
                  <span className="rz-proof__name">{p.name}</span>
                  <div className="rz-proof__role">{p.role}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
