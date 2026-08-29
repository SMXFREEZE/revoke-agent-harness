"use client";

import { usePlayer } from "./PlayerProvider";
import type { Program } from "@/lib/data/catalog";
import { getCategory } from "@/lib/data/catalog";
import { cn } from "@/lib/utils/cn";
import { Spotlight, SpotLightItem } from "@/components/ui/uilayouts/spotlight";

const THEME: Record<string, string> = {
  fitness: "violet", dance: "pink", yoga: "teal", mindfulness: "sun",
  meditation: "plum", sports: "coral", "martial-arts": "sky",
};

export function ProgramCard({ program, className }: { program: Program; className?: string }) {
  const open = usePlayer();
  const cat = getCategory(program.category);

  return (
    <button
      type="button"
      className={cn("rz-w-card", className)}
      data-theme={THEME[program.category] ?? "violet"}
      onClick={() => open(program)}
      aria-label={`Play ${program.title}`}
    >
      {/* ui-layouts Spotlight: pointer-follow accent glow on the poster.
          Proximity/HoverFocus disabled (those use position:fixed window coords
          and would bleed across the grid) — only the contained CursorFlowGradient. */}
      <Spotlight
        ProximitySpotlight={false}
        HoverFocusSpotlight={false}
        CursorFlowGradient={true}
        className="rz-w-card__framewrap"
      >
        <SpotLightItem className="rz-w-card__frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={program.poster} alt={program.title} className="rz-w-card__img" loading="lazy" />
          <span className="rz-w-card__scrim" aria-hidden />
          <span className="rz-w-card__play" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.79-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
          <span className="rz-w-card__dur">{program.duration}</span>
        </SpotLightItem>
      </Spotlight>
      <div className="rz-w-card__meta">
        <span className="rz-w-card__cat">{cat?.name}</span>
        <h3 className="rz-w-card__title">{program.title}</h3>
        <span className="rz-w-card__level">{program.level}</span>
      </div>
    </button>
  );
}
