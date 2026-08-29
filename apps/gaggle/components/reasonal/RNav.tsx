"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// next/link adds the conditional next.config basePath to these internal routes.
const LINKS = [
  { label: "How it works", href: "/#steps" },
  { label: "The agents", href: "/#agents" },
  { label: "FAQ", href: "/#faq" },
];

/** Reasonal-style floating pill nav with a particle-shimmer CTA. */
export function RNav() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);
  const [open, setOpen] = useState(false);

  // particle shimmer behind the CTA label
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let intensity = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    resize();
    const parts = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.2,
      s: 0.2 + Math.random() * 0.8,
    }));
    const loop = () => {
      intensity += (hoverRef.current ? 1 : 0 - intensity) * 0.08;
      intensity = Math.max(0, Math.min(1, intensity + (hoverRef.current ? 0.04 : -0.025)));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += (p.s * 0.0008) % 1;
        if (p.x > 1) p.x = 0;
        const a = intensity * (0.25 + 0.55 * Math.random());
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <header className="rz-nav">
      <div className="rz-nav__inner">
        <Link href="/" className="rz-nav__logo" aria-label="The Gaggle, home">
          <span className="rz-gaggle-logo" aria-hidden><b>THE</b><strong>GAGGLE</strong></span>
        </Link>

        <nav className="rz-nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="rz-nav__link">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="rz-nav__actions">
          <Link
            href="/?run=1#agents"
            className="rz-nav__cta"
            onMouseEnter={() => (hoverRef.current = true)}
            onMouseLeave={() => (hoverRef.current = false)}
          >
            <canvas ref={canvasRef} aria-hidden />
            <span>Watch the agents</span>
          </Link>
          <button
            className={`rz-nav__burger${open ? " is-open" : ""}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && (
        <nav className="rz-nav__mobile" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="rz-nav__mlink" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/?run=1#agents" className="rz-nav__mlink rz-nav__mlink--cta" onClick={() => setOpen(false)}>
            Watch the agents run
          </Link>
        </nav>
      )}
    </header>
  );
}
