import { RWordReveal } from "./reveal";

const PIPELINE = [
  { n: "01", title: "Compete", body: "Defense and Prosecution use different search plans and produce typed arguments for and against every candidate." },
  { n: "02", title: "Admit", body: "The Evidence Clerk accepts only source-linked claims whose biological scope and methodology justify their weight." },
  { n: "03", title: "Compute", body: "The Experimentalist sends deterministic compatibility and counterfactual calculations to an isolated Daytona sandbox." },
  { n: "04", title: "Revise", body: "A blind Red Team and structured jury challenge the leader; the system records the new rank and preserves dissent." },
];

export function RScience() {
  return (
    <section className="rz-sec" id="science">
      <div className="rz-card-w">
        <div className="rz-steps">
          <header className="rz-steps__head">
            <span className="rz-eyebrow">Belief revision</span>
            <RWordReveal as="h2" className="rz-h2" text="A verdict that can show its work." />
            <p className="rz-body-text" style={{ marginTop: "0.8rem", maxWidth: "56ch" }}>
              Candidate A starts at #1 and falls to #3. Candidate B rises from #2 to #1 because
              admitted evidence plus deterministic computation changes the recorded state.
            </p>
          </header>
          <div className="rz-steps__grid">
            {PIPELINE.map((s) => (
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
