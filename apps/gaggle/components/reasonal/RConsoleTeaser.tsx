import Link from "next/link";
import { VantaBackground } from "@/components/layout/VantaBackground";
import { NoiseBackground } from "@/components/ui/noise-background";
import { RWordReveal } from "./reveal";

// Homepage invitation to the standalone /console. The full live report lives at
// /console now; this is the glassy teaser that opens it. Same console aesthetic
// (sky Vanta + the console button + a static terminal preview).
const SKY = { highlightColor: 0xffce3a, midtoneColor: 0x73cef2, lowlightColor: 0x15aeea, baseColor: 0xeaf6ff, blurFactor: 0.62, speed: 0.85, zoom: 0.85 };

export function RConsoleTeaser() {
  return (
    <section className="rz-sec" id="report">
      <div className="rz-card-w">
        <div className="cc rz-cc rz-teaser">
          <VantaBackground effect="fog" className="rz-cc-vanta" options={SKY} />
          <div className="rz-cc-in rz-teaser__grid">
            <div className="rz-teaser__copy">
              <span className="kick">TrueForge &middot; persistent golden run</span>
              <RWordReveal as="h2" className="rz-cc-h2" text="Watch a belief change, with receipts." />
              <p>Resume one synthetic microbiome case and watch distinct specialists retrieve evidence, run a deterministic Daytona experiment, challenge the leader, preserve jury dissent, and stop before promotion.</p>
              <div className="rz-teaser__cta">
                <NoiseBackground containerClassName="rz-nb">
                  <Link href="/?run=1#agents" className="nb-btn">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                    Watch the verified replay
                  </Link>
                </NoiseBackground>
                <span className="rz-teaser__note">verified golden-run replay &middot; synthetic case</span>
              </div>
            </div>

            <div className="rz-teaser__term" aria-hidden>
              <div className="term">
                <div className="term__bar"><span className="term__dot term__dot--r" /><span className="term__dot term__dot--y" /><span className="term__dot term__dot--g" /><span className="term__title">trueforge · gaggle-0042</span></div>
                <div className="term__body">
                  <div className="term__line"><span className="term__prompt">$</span> <span className="term__cmd">trueforge resume gaggle-golden-0042</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; Defense + Prosecution reports admitted</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; Bright Data provenance locked</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; Daytona score moves B from #2 to #1</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; Jury dissent preserved</span></div>
                  <div className="term__line term__outline" style={{ color: "#7df0c0" }}>&rarr; waiting for exact scientist approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
