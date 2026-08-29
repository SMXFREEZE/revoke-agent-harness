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
              <span className="kick">MetaScope &middot; live engine</span>
              <RWordReveal as="h2" className="rz-cc-h2" text="See your gut read, live." />
              <p>A real shotgun-metagenomics pipeline that runs in your browser. Load Jordan&rsquo;s sample or drop your own FASTQ and watch raw DNA reads become a plain-English gut report: taxa classified, diversity scored, dysbiosis flagged. Nothing leaves your device.</p>
              <div className="rz-teaser__cta">
                <NoiseBackground containerClassName="rz-nb">
                  <Link href="/console" className="nb-btn">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                    Open the live console
                  </Link>
                </NoiseBackground>
                <span className="rz-teaser__note">runs in your browser &middot; synthetic demo</span>
              </div>
            </div>

            <div className="rz-teaser__term" aria-hidden>
              <div className="term">
                <div className="term__bar"><span className="term__dot term__dot--r" /><span className="term__dot term__dot--y" /><span className="term__dot term__dot--g" /><span className="term__title">metascope</span></div>
                <div className="term__body">
                  <div className="term__line"><span className="term__prompt">$</span> <span className="term__cmd">metascope run --sample jordan.fastq</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; 6 000 reads pass QC</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; 16 taxa across 5 phyla</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; Shannon 3.15 &middot; Bacteroides enterotype</span></div>
                  <div className="term__line term__outline"><span className="term__ok">&#10003; 5 strains selected &middot; report ready</span></div>
                  <div className="term__line term__outline" style={{ color: "#7df0c0" }}>&rarr; open the console for your full report</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
