"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/TiltCard";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export type Resource = {
  title: string;
  blurb: string;
  img: string;
  tag: string;
  href: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Premium teacher-resource grid: glass cards on a perspective tilt, a
 * cursor-following spotlight glow, image zoom + sheen on hover, and a soft
 * scroll-in stagger. Pointer effects are inert on touch, so it stays clean on
 * mobile. Content + links are passed in unchanged.
 */
export function TeachersResources({ items }: { items: Resource[] }) {
  return (
    <div className="tx-resources">
      {items.map((r, i) => (
        <motion.div
          key={r.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
        >
          <TiltCard className="tx-card-tilt" max={6}>
            <SpotlightCard className="tx-card">
              <Link href={r.href} className="tx-card__inner" aria-label={`Open resource: ${r.title}`} style={{ display: "contents" }}>
                <div className="tx-card__frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={r.title} loading="lazy" />
                  <span className="tx-card__tag">
                    <span className="tx-card__tag-dot" aria-hidden />
                    {r.tag}
                  </span>
                </div>
                <div className="tx-card__body">
                  <h3 className="tx-card__title display">{r.title}</h3>
                  <p className="tx-card__blurb">{r.blurb}</p>
                  <span className="tx-card__link">
                    Open resource
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </SpotlightCard>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  );
}
