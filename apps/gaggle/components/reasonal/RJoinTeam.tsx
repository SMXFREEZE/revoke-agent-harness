import { RWordReveal } from "./reveal";
import { CONTACT } from "@/lib/data/site";

export function RJoinTeam() {
  return (
    <section className="rz-sec" id="careers">
      <div className="rz-card-w">
        <div className="rz-join">
          <div className="rz-join__inner">
            <span className="rz-eyebrow" style={{ color: "#00a35a" }}>
              The beta
            </span>
            <RWordReveal as="h2" className="rz-h3" text="Join the waitlist." />
            <p className="rz-join__body">
              Get on the waitlist to sequence your gut and get a probiotic matched to your DNA.
            </p>
            <a href={`mailto:${CONTACT.email}`} className="rz-join__cta">
              Apply now <span aria-hidden>&rarr;</span>
            </a>
          </div>
          <div className="rz-join__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/tulum/feat-community.jpg" alt="People living well with a gut they understand" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
