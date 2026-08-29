"use client";

import { motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { cn } from "@/lib/utils/cn";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
  variant?: "light" | "violet";
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Consistent header band for inner pages — premium treatment.
 * Prop API is unchanged: { eyebrow, title, intro, variant, className }.
 * The soft brand-gradient wash + glass eyebrow + animated aurora glow live in
 * app/inner-premium.css; the entrance reveal is driven here with framer-motion.
 */
export function PageHero({ eyebrow, title, intro, className, variant = "light" }: PageHeroProps) {
  return (
    <header className={cn("pagehero", variant === "violet" && "on-violet pagehero--violet", className)}>
      {variant === "violet" && <div className="blob pagehero__blob" />}
      <div className="shell pagehero__inner">
        <motion.span
          className="eyebrow"
          style={variant === "violet" ? { color: "var(--sun)" } : undefined}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {eyebrow}
        </motion.span>
        <AnimatedText
          text={title}
          by="word"
          as="h1"
          whileInView={false}
          delay={0.18}
          className="display h-1 pagehero__title"
        />
        {intro && (
          <motion.p
            className="lede pagehero__intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
          >
            {intro}
          </motion.p>
        )}
      </div>
    </header>
  );
}
