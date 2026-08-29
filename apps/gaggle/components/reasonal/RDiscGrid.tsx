"use client";

import type { CSSProperties } from "react";
import Atropos from "atropos/react";
import { DISCIPLINES } from "@/lib/data/site";

const TINT: Record<string, string> = {
  violet: "var(--d-violet)",
  pink: "var(--d-pink)",
  teal: "var(--d-teal)",
  sun: "var(--d-sun)",
  plum: "var(--d-plum)",
  coral: "var(--d-coral)",
  sky: "var(--d-sky)",
  lime: "var(--d-teal)",
};

/** The report glossary: one compact 3-up grid of 3D-tilt cards (Atropos),
 *  one card per metric the live report shows. */
export function RDiscGrid() {
  return (
    <div className="rz-disc__grid rz-disc__grid--gloss">
      {DISCIPLINES.map((d) => {
        const tint = TINT[d.theme] || "var(--d-teal)";
        return (
          <Atropos
            key={d.id}
            className="rz-disc__atropos"
            rotateXMax={6}
            rotateYMax={6}
            rotateTouch={false}
            shadow={false}
            highlight={false}
          >
            <article
              className="rz-disc__card"
              style={{ "--accent": d.accent, "--tint": tint } as CSSProperties}
            >
              <div className="rz-disc__media" data-atropos-offset="4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.art} alt={d.name} loading="lazy" />
                <span className="rz-disc__kicker">{d.group}</span>
              </div>
              <h4 className="rz-disc__name" data-atropos-offset="2">
                <span className="rz-disc__dot" />
                {d.name}
              </h4>
              <p className="rz-disc__blurb">{d.blurb}</p>
            </article>
          </Atropos>
        );
      })}
    </div>
  );
}
