import Link from "next/link";
import { HIGHLIGHTS } from "@/lib/data/site";
import { VantaBackground } from "@/components/layout/VantaBackground";
import { withBasePath } from "@/lib/utils/base-path";

const TAGS = [...HIGHLIGHTS];

const SKY = {
  skyColor: 0x4cb8ee,
  cloudColor: 0xeaf6ff,
  cloudShadowColor: 0x1a5a82,
  sunColor: 0xffd36b,
  sunGlareColor: 0xffdf9a,
  sunlightColor: 0x9fd8f5,
  speed: 0.9,
};

export function RHero() {
  return (
    <section className="rz-hero" id="top">
      <div className="rz-hero__card">
        <VantaBackground effect="clouds" className="rz-hero__vanta" options={SKY} />

        <div className="rz-hero__inner">
          <span className="rz-hero__eyebrow">Adversarial microbiome R&amp;D, built to disagree</span>
          <h1 className="rz-hero__title">
            One AI can convince itself.
            <br />
            <em className="rz-serif">Ours has to survive the Gaggle.</em>
          </h1>
          <p className="rz-hero__sub">
            Independent AI scientists argue, retrieve live evidence, run deterministic
            experiments, challenge the leader, revise their beliefs, and stop for a human scientist.
          </p>
          <div className="rz-hero__cta">
            <Link href="/#agents" className="rz-hero__btn rz-hero__btn--go">
              Watch the agents run
              <span aria-hidden>&rarr;</span>
            </Link>
            <Link href="/#steps" className="rz-hero__btn rz-hero__btn--ghost">
              How it works
            </Link>
          </div>

          <div className="rz-hero__tags" aria-hidden>
            {TAGS.map((t) => (
              <span className="rz-hero__tag" key={t}>
                {t}
              </span>
            ))}
          </div>

          <div className="rz-phone">
            <span className="rz-phone__notch" aria-hidden />
            <div className="rz-phone__screen">
              <video className="rz-phone__media" src={withBasePath("/hero/microbiome.mp4")} poster={withBasePath("/hero/ai-microbiome.webp")} autoPlay loop muted playsInline aria-hidden />
              <span className="rz-phone__glare" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
