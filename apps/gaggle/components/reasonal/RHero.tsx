import Link from "next/link";
import { HIGHLIGHTS } from "@/lib/data/site";
import { VantaBackground } from "@/components/layout/VantaBackground";

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
          <span className="rz-hero__eyebrow">Sequenced first, then built for your gut</span>
          <h1 className="rz-hero__title">
            Most probiotics die before they help.
            <br />
            <em className="rz-serif">Yours start with your DNA.</em>
          </h1>
          <p className="rz-hero__sub">
            We sequence your gut first, then build a probiotic matched to your DNA, chosen to
            take root where generic strains wash out.
          </p>
          <div className="rz-hero__cta">
            <Link href="/console" className="rz-hero__btn rz-hero__btn--go">
              Open the live report
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
              <video className="rz-phone__media" src="/hero/microbiome.mp4" poster="/hero/ai-microbiome.webp" autoPlay loop muted playsInline aria-hidden />
              <span className="rz-phone__glare" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
