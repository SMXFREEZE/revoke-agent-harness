"use client";

import { motion, type Variants } from "framer-motion";
import { Fragment, useMemo, type ElementType } from "react";
import { cn } from "@/lib/utils/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  by?: "word" | "line";
  delay?: number;
  whileInView?: boolean;
  once?: boolean;
}

/** Masked word/line reveal that springs up into place. */
export function AnimatedText({
  text,
  as = "span",
  className,
  by = "word",
  delay = 0,
  whileInView = true,
  once = true,
}: Props) {
  const Tag = useMemo(() => motion.create(as as ElementType), [as]);
  const units = by === "line" ? text.split("\n") : text.split(" ");

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: by === "line" ? 0.1 : 0.04, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: "115%" },
    show: { y: "0%", transition: { duration: 0.8, ease: EASE } },
  };
  const animateProps = whileInView
    ? { whileInView: "show", viewport: { once, amount: 0.35 } }
    : { animate: "show" };

  return (
    <Tag
      className={cn("anim-text", by === "line" && "anim-text--lines", className)}
      variants={container}
      initial="hidden"
      {...animateProps}
    >
      {units.map((u, i) => (
        <Fragment key={i}>
          <span className="anim-text__mask">
            <motion.span className="anim-text__unit" variants={child}>
              {u}
            </motion.span>
          </span>
          {by === "word" && i < units.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
