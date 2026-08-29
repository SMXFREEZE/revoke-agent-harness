"use client";

import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const COLORS = ["#6901ff", "#ff4db5", "#00c2a8", "#ffc400", "#ff7a45", "#2bb3ff"];

/** Anchor that fires a canvas-confetti burst on click, then navigates. */
export function RConfettiLink({
  href,
  className,
  children,
  external = false,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const router = useRouter();

  const fire = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = e.clientX / window.innerWidth || 0.5;
    const y = e.clientY / window.innerHeight || 0.7;
    confetti({
      particleCount: 120,
      spread: 78,
      startVelocity: 46,
      origin: { x, y },
      colors: COLORS,
      scalar: 0.9,
      ticks: 220,
      disableForReducedMotion: true,
    });
    window.setTimeout(() => {
      if (external) window.open(href, "_blank", "noopener");
      else router.push(href);
    }, 520);
  };

  return (
    <a href={href} className={className} onClick={fire}>
      {children}
    </a>
  );
}
