"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Generic scroll-into-view reveal — fade + rise + a gentle overshoot pop. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = "div",
  theme,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "section" | "article";
  theme?: string;
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={cn(className)}
      data-theme={theme}
      initial={{ opacity: 0, y, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: "spring", stiffness: 95, damping: 15, mass: 0.9, delay }}
    >
      {children}
    </Tag>
  );
}
