"use client";

import Link from "next/link";
import { useState } from "react";
import { type Colors, Liquid } from "@/components/ui/uilayouts/liquid-gradient";

// Green "liquid metal" palette for the ui-layouts Liquid gradient.
const RED: Colors = {
  color1: "#FFFFFF",
  color2: "#00A35A",
  color3: "#7DF0C0",
  color4: "#F2FFFA",
  color5: "#EAFFF6",
  color6: "#B6FFD9",
  color7: "#00C878",
  color8: "#00E08A",
  color9: "#2CFF92",
  color10: "#5CF0B0",
  color11: "#06D886",
  color12: "#C5F5E3",
  color13: "#03C878",
  color14: "#B6F6D6",
  color15: "#C1F5E8",
  color16: "#00B86D",
  color17: "#46C0A0",
};

/** The ui-layouts "Liquid" (liquid-metal) animated gradient as the band CTA:
 *  a dark pill whose fill is a living red liquid that surges on hover. */
export function RLiquidWatch() {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href="#book"
      aria-label="Book a free call"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rzlw relative inline-block w-64 h-14 group rounded-full align-middle"
    >
      {/* Liquid effect — desktop only (hidden on phones via .rzlw-fx, where the
          solid red `.rzlw` base shows through so the button always looks right). */}
      <span className="rzlw-fx">
        {/* soft glow halo behind the pill */}
        <span className="absolute block w-[112%] h-[155%] -top-[28%] left-1/2 -translate-x-1/2 filter blur-[19px] opacity-70 pointer-events-none">
          <span className="absolute inset-0 rounded-full bg-[#d9d9d9] filter blur-[6.5px]" />
          <span className="relative block w-full h-full overflow-hidden rounded-full">
            <Liquid isHovered={hover} colors={RED} />
          </span>
        </span>

        {/* dark seated base */}
        <span className="absolute block top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42%] w-[93%] h-[112%] rounded-full bg-[#180202] filter blur-[7.3px] pointer-events-none" />

        {/* face: the living liquid fill */}
        <span className="relative block w-full h-full overflow-hidden rounded-full">
          <span className="absolute inset-0 rounded-full bg-[#d9d9d9]" />
          <span className="absolute inset-0 rounded-full bg-black" />
          <Liquid isHovered={hover} colors={RED} />
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={`spark-${i}`}
              className={`absolute inset-0 rounded-full border-2 border-white/25 mix-blend-overlay filter ${
                i <= 2 ? "blur-[3px]" : i === 3 ? "blur-[5px]" : "blur-[2px]"
              }`}
            />
          ))}
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70%] h-[42%] rounded-full filter blur-[15px] bg-[#600]" />
        </span>
      </span>

      {/* label — always on top */}
      <span
        className="rzlw-label absolute inset-0 flex items-center justify-center gap-2 text-white text-lg font-semibold tracking-wide whitespace-nowrap"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Book a free call <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
