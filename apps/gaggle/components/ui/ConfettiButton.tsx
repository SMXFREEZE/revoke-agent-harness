"use client";

import { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";

const COLORS = ["#6901ff", "#ffdf2b", "#ff4db5", "#00c2a8", "#2bb3ff", "#ffffff"];

type Piece = { id: number; x: number; y: number; rot: number; color: string; r: number; round: boolean };

/**
 * The signature "joy" CTA. Three small delights, each tuned to stay refined:
 *  - magnetic pull toward the cursor (clamped, springy)
 *  - jelly squash on tap
 *  - a soft confetti burst on click, then it navigates a beat later
 * Everything is interaction-triggered and brand-coloured.
 */
export function ConfettiButton({
  href,
  children,
  variant = "violet",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "violet" | "sun";
  className?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const idRef = useRef(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const x = useSpring(0, { stiffness: 260, damping: 18 });
  const y = useSpring(0, { stiffness: 260, damping: 18 });

  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * 0.25, 12));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * 0.4, 10));
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const burst = () => {
    const next: Piece[] = Array.from({ length: 18 }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = 56 + Math.random() * 72;
      return {
        id: idRef.current++,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d - 18,
        rot: (Math.random() - 0.5) * 540,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        r: 6 + Math.random() * 6,
        round: Math.random() > 0.5,
      };
    });
    setPieces(next);
    window.setTimeout(() => setPieces([]), 820);
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    burst();
    window.setTimeout(() => {
      if (href.startsWith("/")) router.push(href);
      else window.location.href = href;
    }, 300);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`joybtn ${variant === "sun" ? "joybtn--sun" : ""} ${className}`}
      style={{ x, y }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="confetti-piece"
          style={{ background: p.color, width: p.r, height: p.r, borderRadius: p.round ? "50%" : "3px" }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4, rotate: p.rot }}
          transition={{ duration: 0.72, ease: "easeOut" }}
        />
      ))}
    </motion.a>
  );
}
