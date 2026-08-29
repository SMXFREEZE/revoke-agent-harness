"use client";

import Link from "next/link";
import confetti from "canvas-confetti";
import { NAV_LINKS } from "@/lib/data/site";

export function TulumNav() {
  return (
    <header className="tdj-nav">
      <div className="tdj-nav__inner">
        <Link href="/" className="tdj-nav__logo" aria-label="Tulum DJ Academy, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tulum-logo.webp" alt="Tulum DJ Academy" draggable={false} />
        </Link>

        <nav className="tdj-nav__links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="tdj-nav__link">
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="tdj-btn tdj-nav__cta"
          onClick={(e) => {
            confetti({
              particleCount: 90,
              spread: 75,
              startVelocity: 42,
              origin: { x: e.clientX / window.innerWidth || 0.9, y: 0.06 },
              colors: ["#2cff92", "#00d084", "#00c1c0", "#7df0c0", "#b6ff6a"],
              scalar: 0.85,
              disableForReducedMotion: true,
            });
            document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Become a DJ
        </button>
      </div>
    </header>
  );
}
