import { RWordReveal } from "./reveal";
import { STEPS } from "@/lib/data/site";

export function RSteps() {
  return (
    <section className="rz-sec" id="steps">
      <div className="rz-card-w">
        <div className="rz-steps">
          <header className="rz-steps__head">
            <span className="rz-eyebrow">How it works</span>
            <RWordReveal as="h2" className="rz-h2" text="From stool sample to matched formula." />
          </header>
          <div className="rz-steps__grid">
            {STEPS.map((s) => (
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
